package com.vic.ecom.services;

import com.vic.ecom.dto.CheckoutDtos;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.*;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class CustomerCheckoutService {
    private static final BigDecimal SHIPPING_FEE_FLAT = BigDecimal.valueOf(30000);
    private final CustomerProfileService profiles; private final CartRepository carts; private final CartItemRepository cartItems;
    private final AddressRepository addresses; private final ProductVariantRepository variants; private final CheckoutStockRepository stock;
    private final VoucherRepository vouchers; private final CampaignProductRepository campaigns; private final OrderRepository orders;
    private final OrderItemRepository orderItems; private final PaymentRepository payments; private final OrderStatusHistoryRepository histories;
    private final ShopRepository shops; private final CheckoutGroupRepository checkoutGroups; private final ProductMediaRepository media;

    @Transactional(readOnly = true)
    public CheckoutDtos.Preview preview(Authentication auth, CheckoutDtos.Request request) { return calculate(auth, request).preview; }

    @Transactional
    public CheckoutDtos.Placed place(Authentication auth, CheckoutDtos.Request request) {
        Calculation c = calculate(auth, request);
        User customer = profiles.requireActiveCustomer(auth);
        for (Line line : c.lines) if (stock.reserve(line.variant.getId(), line.quantity) != 1) throw CustomerAccountException.unprocessable("STOCK_EXCEEDED", "Tồn kho thay đổi, vui lòng thử lại", "cartItemIds");
        for (ShopBlock block : c.blocks) {
            if (block.voucher != null && vouchers.reserveUsage(block.voucher.getId()) != 1) throw CustomerAccountException.unprocessable("INVALID_VOUCHER", "Voucher vừa hết lượt sử dụng", "vouchers");
            for (Line line : block.lines) if (line.campaign != null && campaigns.reserveQuota(line.campaign.getId(), line.quantity) != 1) throw CustomerAccountException.unprocessable("CAMPAIGN_QUOTA_EXCEEDED", "Ưu đãi vừa hết quota", "cartItemIds");
        }
        CheckoutGroup group = new CheckoutGroup(); group.setCustomerId(customer.getId()); group.setTotalAmount(c.preview.grandTotal());
        CheckoutGroup savedGroup = checkoutGroups.save(group);
        List<CheckoutDtos.Order> placed = new ArrayList<>();
        for (ShopBlock block : c.blocks) {
            Order order = new Order(); order.setCustomer(customer); order.setShopId(block.shop.getId());
            order.setCheckoutGroupId(savedGroup.getId());
            order.setReceiverName(c.address.getReceiverName()); order.setReceiverPhone(c.address.getPhone()); order.setShippingAddress(c.address.getAddressDetail());
            order.setSubtotal(block.subtotal); order.setShippingFee(SHIPPING_FEE_FLAT); order.setDiscountAmount(block.discount); order.setTotalAmount(block.total); order.setStatus(OrderStatus.PENDING); order.setOrderCode(orderCode());
            if (block.voucher != null) order.setVoucherId(block.voucher.getId());
            Order saved = orders.save(order);
            for (Line line : block.lines) { OrderItem item = new OrderItem(); item.setOrder(saved); item.setVariantId(line.variant.getId()); item.setProductName(line.variant.getProduct().getName()); item.setUnitPrice(line.unitPrice); item.setQuantity(line.quantity); orderItems.save(item); }
            Payment payment = new Payment(); payment.setOrder(saved); payment.setMethod(PaymentMethod.COD); payment.setAmount(block.total); payment.setStatus("PENDING"); payments.save(payment);
            OrderStatusHistory h = new OrderStatusHistory(); h.setOrderId(saved.getId()); h.setChangedBy(customer.getId()); h.setFromStatus(null); h.setToStatus(OrderStatus.PENDING); h.setNote("Customer đặt hàng"); histories.save(h);
            placed.add(new CheckoutDtos.Order(saved.getId(), saved.getOrderCode(), block.shop.getName(), block.total));
        }
        cartItems.deleteAll(c.lines.stream().map(l -> l.item).toList());
        return new CheckoutDtos.Placed(savedGroup.getId(), placed, c.preview.grandTotal());
    }

    private Calculation calculate(Authentication auth, CheckoutDtos.Request request) {
        if (request == null || request.cartItemIds() == null || request.cartItemIds().isEmpty() || request.cartItemIds().size() > 100) throw CustomerAccountException.badRequest("INVALID_CART_ITEMS", "cartItemIds phải từ 1 đến 100 phần tử", "cartItemIds");
        if (request.addressId() == null) throw CustomerAccountException.badRequest("ADDRESS_REQUIRED", "Cần chọn địa chỉ nhận hàng", "addressId");
        if (request.paymentMethod() != null && !"COD".equalsIgnoreCase(request.paymentMethod())) throw CustomerAccountException.unprocessable("PAYMENT_METHOD_UNSUPPORTED", "Chỉ hỗ trợ thanh toán COD", "paymentMethod");
        User customer = profiles.requireActiveCustomer(auth); Cart cart = carts.findFirstByUserIdOrderByIdAsc(customer.getId()).orElseThrow(() -> CustomerAccountException.notFound("CART_NOT_FOUND", "Giỏ hàng không tồn tại"));
        Address address = addresses.findByIdAndUser_Id(request.addressId(), customer.getId()).orElseThrow(() -> CustomerAccountException.notFound("ADDRESS_NOT_FOUND", "Địa chỉ không thuộc tài khoản"));
        Map<Long, CartItem> owned = cartItems.findByCartIdOrderByIdAsc(cart.getId()).stream().filter(i -> request.cartItemIds().contains(i.getId())).collect(Collectors.toMap(CartItem::getId, x -> x));
        if (owned.size() != new HashSet<>(request.cartItemIds()).size()) throw CustomerAccountException.notFound("CART_ITEM_NOT_FOUND", "Có sản phẩm không thuộc giỏ hàng");
        List<Line> lines = new ArrayList<>();
        for (Long id : request.cartItemIds()) { CartItem item = owned.get(id); if (item.getQuantity() < 1 || item.getQuantity() > 99) throw CustomerAccountException.badRequest("INVALID_QUANTITY", "Số lượng không hợp lệ", "quantity"); ProductVariant v = variants.findById(item.getVariantId()).orElseThrow(() -> CustomerAccountException.notFound("VARIANT_NOT_FOUND", "Không tìm thấy biến thể")); if (!"VISIBLE".equals(v.getProduct().getStatus()) || v.getProduct().getShop() == null || v.getProduct().getShop().getStatus() != ShopStatus.ACTIVE) throw CustomerAccountException.unprocessable("PRODUCT_UNAVAILABLE", "Sản phẩm không còn bán", "cartItemIds"); var campaign = activeCampaign(v); lines.add(new Line(item, v, item.getQuantity(), campaignPrice(v, campaign), campaign, thumbnail(v))); }
        Map<Long, List<Line>> grouped = lines.stream().collect(Collectors.groupingBy(l -> l.variant.getProduct().getShop().getId(), LinkedHashMap::new, Collectors.toList()));
        List<ShopBlock> blocks = grouped.values().stream().map(ls -> block(ls, request.vouchers())).toList();
        return new Calculation(address, lines, blocks, new CheckoutDtos.Preview(blocks.stream().map(ShopBlock::preview).toList(), blocks.stream().map(b -> b.total).reduce(BigDecimal.ZERO, BigDecimal::add)));
    }

    private CampaignProduct activeCampaign(ProductVariant v) { LocalDateTime now = LocalDateTime.now(); return campaigns.findFirstByVariant_IdAndCampaign_StatusAndCampaign_StartAtBeforeAndCampaign_EndAtAfterOrderByIdDesc(v.getId(), com.vic.ecom.enums.CampaignStatus.ACTIVE, now, now).orElse(null); }
    private BigDecimal campaignPrice(ProductVariant v, CampaignProduct c) { if (c == null) return v.getPrice(); return c.getDiscountType() == VoucherDiscountType.PERCENT ? v.getPrice().multiply(BigDecimal.ONE.subtract(c.getDiscountValue().divide(BigDecimal.valueOf(100)))) : v.getPrice().subtract(c.getDiscountValue()).max(BigDecimal.ZERO); }
    private ShopBlock block(List<Line> lines, List<CheckoutDtos.VoucherInput> inputs) { Shop shop = lines.get(0).variant.getProduct().getShop(); BigDecimal subtotal = lines.stream().map(l -> l.unitPrice.multiply(BigDecimal.valueOf(l.quantity))).reduce(BigDecimal.ZERO, BigDecimal::add); Voucher voucher = findVoucher(shop.getId(), inputs); BigDecimal discount = voucher == null ? BigDecimal.ZERO : discount(voucher, subtotal); BigDecimal total = subtotal.add(SHIPPING_FEE_FLAT).subtract(discount).max(BigDecimal.ZERO); return new ShopBlock(shop, lines, subtotal, voucher, discount, total); }
    private Voucher findVoucher(Long shopId, List<CheckoutDtos.VoucherInput> inputs) { if (inputs == null) return null; long count = inputs.stream().filter(i -> i.shopId() != null && i.shopId().equals(shopId)).count(); if (count > 1) throw CustomerAccountException.unprocessable("MULTIPLE_VOUCHERS", "Mỗi shop chỉ được dùng một voucher", "vouchers"); return inputs.stream().filter(i -> shopId.equals(i.shopId())).findFirst().map(i -> vouchers.findByShopIdAndCodeIgnoreCase(shopId, i.code()).orElseThrow(() -> CustomerAccountException.unprocessable("INVALID_VOUCHER", "Voucher không hợp lệ cho shop", "vouchers"))).map(v -> valid(v) ? v : null).orElse(null); }
    private boolean valid(Voucher v) { LocalDateTime now = LocalDateTime.now(); if (v.getStatus() != VoucherStatus.ACTIVE || now.isBefore(v.getStartAt()) || now.isAfter(v.getEndAt()) || v.getUsedCount() >= v.getUsageLimit()) throw CustomerAccountException.unprocessable("INVALID_VOUCHER", "Voucher chưa đủ điều kiện sử dụng", "vouchers"); return true; }
    private BigDecimal discount(Voucher v, BigDecimal subtotal) { if (subtotal.compareTo(v.getMinOrderAmount()) < 0) throw CustomerAccountException.unprocessable("VOUCHER_MINIMUM_NOT_MET", "Chưa đạt giá trị đơn tối thiểu của voucher", "vouchers"); BigDecimal d = v.getDiscountType() == VoucherDiscountType.PERCENT ? subtotal.multiply(v.getValue()).divide(BigDecimal.valueOf(100)) : v.getValue(); if (v.getMaxDiscount() != null) d = d.min(v.getMaxDiscount()); return d.min(subtotal).max(BigDecimal.ZERO); }
    private String orderCode() { return "VC" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 4).toUpperCase(Locale.ROOT); }
    private record Line(CartItem item, ProductVariant variant, int quantity, BigDecimal unitPrice, CampaignProduct campaign, String thumbnail) {}
    private record ShopBlock(Shop shop, List<Line> lines, BigDecimal subtotal, Voucher voucher, BigDecimal discount, BigDecimal total) { CheckoutDtos.ShopPreview preview() { return new CheckoutDtos.ShopPreview(shop.getId(), shop.getName(), lines.stream().map(l -> new CheckoutDtos.Item(l.item.getId(), l.variant.getId(), l.variant.getProduct().getName(), l.variant.getVariantName(), l.thumbnail, l.unitPrice, l.unitPrice.equals(l.variant.getPrice()) ? null : l.variant.getPrice(), l.quantity, l.unitPrice.multiply(BigDecimal.valueOf(l.quantity)))).toList(), subtotal, SHIPPING_FEE_FLAT, voucher == null ? null : voucher.getCode(), discount, total); } }
    private String thumbnail(ProductVariant variant) {
        return media.findByProductIdOrderBySortOrderAscIdAsc(variant.getProduct().getId()).stream()
                .filter(m -> m.getType() == ProductMediaType.IMAGE)
                .map(ProductMedia::getUrl).findFirst().orElse(variant.getImageUrl());
    }
    private record Calculation(Address address, List<Line> lines, List<ShopBlock> blocks, CheckoutDtos.Preview preview) {}
}
