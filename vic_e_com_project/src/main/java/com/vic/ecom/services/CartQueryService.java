package com.vic.ecom.services;

import com.vic.ecom.dto.CartDtos;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CartQueryService {
    private final UserRepository users;
    private final CartRepository carts;
    private final CartItemRepository items;
    private final ProductVariantRepository variants;
    private final ProductMediaRepository media;
    private final VariantAttributeRepository attributes;

    @Transactional(readOnly = true)
    public CartDtos.CartResponse get(Authentication auth) {
        Cart cart = cart(auth);
        if (cart == null) return new CartDtos.CartResponse(List.of(), List.of(), 0);
        List<CartItem> rows = items.findByCartIdOrderByIdAsc(cart.getId());
        Map<Long, ProductVariant> byVariant = variants.findAllById(rows.stream().map(CartItem::getVariantId).toList())
                .stream().collect(Collectors.toMap(ProductVariant::getId, Function.identity()));
        Map<Long, String> images = imageMap(byVariant.values());
        Map<Long, String> labels = labelMap(byVariant.keySet());
        List<CartDtos.Item> available = new ArrayList<>();
        List<CartDtos.Item> unavailable = new ArrayList<>();
        for (CartItem row : rows) {
            ProductVariant v = byVariant.get(row.getVariantId());
            if (v == null) continue;
            CartDtos.Item item = item(row, v, images, labels, null);
            if (isAvailable(v)) available.add(item);
            else unavailable.add(item(row, v, images, labels, reason(v)));
        }
        Map<Long, List<CartDtos.Item>> grouped = available.stream().collect(Collectors.groupingBy(
                i -> byVariant.get(i.variantId()).getProduct().getShop().getId(), LinkedHashMap::new, Collectors.toList()));
        List<CartDtos.ShopGroup> shops = grouped.entrySet().stream().map(e -> new CartDtos.ShopGroup(
                e.getKey(), byVariant.get(e.getValue().get(0).variantId()).getProduct().getShop().getName(), e.getValue())).toList();
        return new CartDtos.CartResponse(shops, unavailable, available.size());
    }

    @Transactional(readOnly = true)
    public int count(Authentication auth) {
        CartDtos.CartResponse response = get(auth);
        return response.itemCount();
    }

    Cart cart(Authentication auth) {
        User user = users.findByEmail(auth.getName()).or(() -> users.findByPhone(auth.getName()))
                .orElseThrow(() -> CustomerAccountException.unauthorized("Không xác định được tài khoản"));
        return carts.findFirstByUserIdOrderByIdAsc(user.getId()).orElse(null);
    }

    Long userId(Authentication auth) {
        return users.findByEmail(auth.getName()).or(() -> users.findByPhone(auth.getName()))
                .orElseThrow(() -> CustomerAccountException.unauthorized("Không xác định được tài khoản")).getId();
    }

    boolean isAvailable(ProductVariant v) {
        return v.getStockQty() > 0 && "VISIBLE".equals(v.getProduct().getStatus())
                && v.getProduct().getShop() != null && v.getProduct().getShop().getStatus() == ShopStatus.ACTIVE;
    }

    String reason(ProductVariant v) {
        return v.getStockQty() <= 0 ? "OUT_OF_STOCK" : "PRODUCT_UNAVAILABLE";
    }

    private CartDtos.Item item(CartItem row, ProductVariant v, Map<Long, String> images,
                               Map<Long, String> labels, String reason) {
        return new CartDtos.Item(row.getId(), v.getProduct().getId(), v.getProduct().getName(),
                images.get(v.getProduct().getId()), v.getId(), labels.getOrDefault(v.getId(), v.getSku()), v.getPrice(),
                row.getQuantity(), v.getStockQty(), v.getStockQty() <= v.getLowStockThreshold(), reason);
    }

    private Map<Long, String> imageMap(Collection<ProductVariant> values) {
        List<Long> ids = values.stream().map(v -> v.getProduct().getId()).distinct().toList();
        return media.findByProductIdInOrderBySortOrderAscIdAsc(ids).stream().collect(Collectors.toMap(
                ProductMedia::getProductId, ProductMedia::getUrl, (a, b) -> a));
    }

    private Map<Long, String> labelMap(Collection<Long> ids) {
        return attributes.findByVariantIdInOrderByIdAsc(ids).stream().collect(Collectors.groupingBy(
                VariantAttribute::getVariantId, LinkedHashMap::new,
                Collectors.mapping(VariantAttribute::getAttrValue, Collectors.joining(", "))));
    }
}
