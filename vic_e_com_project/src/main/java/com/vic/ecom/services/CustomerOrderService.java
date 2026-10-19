package com.vic.ecom.services;

import com.vic.ecom.dto.OrderDtos.*;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.InventoryLogReason;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.CustomerAccountValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CustomerOrderService {
    private final CustomerProfileService profileService;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ShopRepository shopRepository;
    private final PaymentRepository paymentRepository;
    private final ProductVariantRepository productVariantRepository;
    private final InventoryLogRepository inventoryLogRepository;
    private final VoucherUsageRepository voucherUsageRepository;
    private final OrderStatusHistoryRepository orderStatusHistoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;

    @Transactional(readOnly = true)
    public OrderPageDto listOrders(Authentication auth, String statusFilter, int page, int size) {
        User customer = profileService.requireActiveCustomer(auth);
        if (page < 0 || size < 1 || size > 50) {
            throw CustomerAccountException.badRequest("INVALID_PAGINATION", "Tham số phân trang không hợp lệ", "size");
        }
        List<OrderStatus> dbStatuses;
        try {
            dbStatuses = CustomerAccountValidator.mapFilterToDbStatuses(statusFilter);
        } catch (IllegalArgumentException ex) {
            throw CustomerAccountException.badRequest("INVALID_ORDER_STATUS", ex.getMessage(), "status");
        }
        PageRequest pageable = PageRequest.of(page, size);
        Page<Order> orderPage = dbStatuses.isEmpty()
                ? orderRepository.findByCustomer_IdOrderByCreatedAtDescIdDesc(customer.getId(), pageable)
                : orderRepository.findByCustomer_IdAndStatusInOrderByCreatedAtDescIdDesc(customer.getId(), dbStatuses, pageable);
        List<Order> orders = orderPage.getContent();
        Map<Long, List<OrderItem>> itemsByOrderId = loadItemsByOrderIds(orders);
        Map<Long, String> shopNames = loadShopNames(orders);
        List<OrderCardDto> cards = orders.stream()
                .map(o -> toCardDto(o, itemsByOrderId.getOrDefault(o.getId(), List.of()), shopNames))
                .toList();
        return new OrderPageDto(cards, orderPage.getNumber(), orderPage.getSize(),
                orderPage.getTotalElements(), orderPage.getTotalPages(), buildCountsByStatus(customer.getId()));
    }

    @Transactional
    public OrderCardDto cancelOrder(Authentication auth, Long orderId, CancelOrderRequest req) {
        User customer = profileService.requireActiveCustomer(auth);
        if (req == null || !CustomerAccountValidator.isValidCancelReason(req.reason())) {
            throw CustomerAccountException.badRequest("INVALID_CANCEL_REASON", "Lý do hủy đơn phải từ 5 đến 300 ký tự", "reason");
        }
        Order order = requireOwnedOrder(customer.getId(), orderId);
        OrderStatus previousStatus = order.getStatus();
        if (previousStatus != OrderStatus.PENDING && previousStatus != OrderStatus.CONFIRMED) {
            throw CustomerAccountException.conflict("ORDER_NOT_CANCELLABLE", "Đơn hàng ở trạng thái hiện tại không thể hủy", "status");
        }
        String trimmedReason = req.reason().trim();
        order.setStatus(OrderStatus.CANCELLED);
        order.setReason(trimmedReason);
        orderRepository.save(order);

        List<OrderItem> items = orderItemRepository.findByOrder_IdOrderByIdAsc(order.getId());
        restoreInventoryAndWriteLogs(order.getId(), customer.getId(), items);
        voucherUsageRepository.deleteByOrderId(order.getId());
        paymentRepository.dropLegacyStatusCheckConstraint();
        paymentRepository.markPaymentsFailedByOrderId(order.getId());
        saveCancelHistory(order.getId(), customer.getId(), previousStatus, trimmedReason);
        return toCardDto(order, items, loadShopNames(List.of(order)));
    }

    @Transactional
    public RebuyResponse rebuyOrder(Authentication auth, Long orderId) {
        User customer = profileService.requireActiveCustomer(auth);
        Order order = requireOwnedOrder(customer.getId(), orderId);
        List<OrderItem> items = orderItemRepository.findByOrder_IdOrderByIdAsc(order.getId());
        Cart cart = cartRepository.findFirstByUserIdOrderByIdAsc(customer.getId()).orElseGet(() -> {
            Cart c = new Cart();
            c.setUserId(customer.getId());
            return cartRepository.save(c);
        });
        int addedCount = 0;
        for (OrderItem item : items) {
            if (item.getVariantId() == null) continue;
            ProductVariant variant = productVariantRepository.findById(item.getVariantId()).orElse(null);
            if (variant == null || variant.getStockQty() == null || variant.getStockQty() <= 0) continue;
            int qtyToAdd = Math.min(Math.max(1, item.getQuantity()), variant.getStockQty());
            CartItem cartItem = cartItemRepository.findByCartIdAndVariantId(cart.getId(), variant.getId()).orElseGet(() -> {
                CartItem ci = new CartItem();
                ci.setCartId(cart.getId());
                ci.setVariantId(variant.getId());
                ci.setQuantity(0);
                return ci;
            });
            cartItem.setQuantity(Math.min(variant.getStockQty(), cartItem.getQuantity() + qtyToAdd));
            cartItemRepository.save(cartItem);
            addedCount += qtyToAdd;
        }
        return new RebuyResponse(addedCount);
    }

    private void restoreInventoryAndWriteLogs(Long orderId, Long userId, List<OrderItem> items) {
        for (OrderItem item : items) {
            if (item.getVariantId() == null) continue;
            productVariantRepository.findById(item.getVariantId()).ifPresent(variant -> {
                int qty = item.getQuantity() != null ? item.getQuantity() : 0;
                variant.setStockQty((variant.getStockQty() != null ? variant.getStockQty() : 0) + qty);
                productVariantRepository.save(variant);
                InventoryLog log = new InventoryLog();
                log.setVariantId(variant.getId());
                log.setOrderId(orderId);
                log.setCreatedBy(userId);
                log.setChangeQty(qty);
                log.setReason(InventoryLogReason.CANCEL);
                inventoryLogRepository.save(log);
            });
        }
    }

    private void saveCancelHistory(Long orderId, Long userId, OrderStatus fromStatus, String note) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrderId(orderId);
        history.setChangedBy(userId);
        history.setFromStatus(fromStatus);
        history.setToStatus(OrderStatus.CANCELLED);
        history.setNote(note);
        history.setChangedAt(LocalDateTime.now());
        orderStatusHistoryRepository.save(history);
    }

    private Order requireOwnedOrder(Long customerId, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> CustomerAccountException.notFound("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng"));
        if (order.getCustomer() == null || !customerId.equals(order.getCustomer().getId())) {
            throw CustomerAccountException.forbidden("Bạn không có quyền truy cập đơn hàng này");
        }
        return order;
    }

    private Map<String, Long> buildCountsByStatus(Long customerId) {
        Map<String, Long> counts = new LinkedHashMap<>(Map.of(
                "ALL", 0L, "PENDING", 0L, "CONFIRMED", 0L, "SHIPPING", 0L, "COMPLETED", 0L, "CANCELLED", 0L));
        long total = 0L;
        for (Object[] row : orderRepository.countGroupByStatusForCustomer(customerId)) {
            String uiKey = CustomerAccountValidator.mapDbStatusToUiStatus((OrderStatus) row[0]);
            long cnt = ((Number) row[1]).longValue();
            counts.put(uiKey, counts.getOrDefault(uiKey, 0L) + cnt);
            total += cnt;
        }
        counts.put("ALL", total);
        return counts;
    }

    private Map<Long, List<OrderItem>> loadItemsByOrderIds(List<Order> orders) {
        if (orders.isEmpty()) return Map.of();
        Set<Long> ids = orders.stream().map(Order::getId).collect(Collectors.toSet());
        return orderItemRepository.findByOrder_IdInOrderByIdAsc(ids).stream()
                .collect(Collectors.groupingBy(oi -> oi.getOrder().getId()));
    }

    private Map<Long, String> loadShopNames(List<Order> orders) {
        Set<Long> shopIds = orders.stream().map(Order::getShopId).filter(Objects::nonNull).collect(Collectors.toSet());
        if (shopIds.isEmpty()) return Map.of();
        return shopRepository.findAllById(shopIds).stream()
                .collect(Collectors.toMap(Shop::getId, Shop::getName, (a, b) -> a));
    }

    private OrderCardDto toCardDto(Order o, List<OrderItem> items, Map<Long, String> shopNames) {
        boolean canCancel = o.getStatus() == OrderStatus.PENDING || o.getStatus() == OrderStatus.CONFIRMED;
        String shopName = o.getShopId() != null ? shopNames.getOrDefault(o.getShopId(), "VIC Mall") : "VIC Mall";
        List<OrderItemDto> itemDtos = items.stream().map(oi -> {
            int qty = oi.getQuantity() != null ? oi.getQuantity() : 1;
            BigDecimal price = oi.getUnitPrice() != null ? oi.getUnitPrice() : BigDecimal.ZERO;
            return new OrderItemDto(oi.getVariantId(), oi.getProductName(), "", null, qty, price, price.multiply(BigDecimal.valueOf(qty)));
        }).toList();
        return new OrderCardDto(o.getId(), o.getOrderCode(), o.getShopId(), shopName,
                CustomerAccountValidator.mapDbStatusToUiStatus(o.getStatus()), o.getCreatedAt(), o.getTotalAmount(), canCancel, itemDtos);
    }
}
