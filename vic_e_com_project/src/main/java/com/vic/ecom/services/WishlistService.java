package com.vic.ecom.services;

import com.vic.ecom.dto.WishlistDtos;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.repository.*;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishlistService {
    private final WishlistRepository wishlists;
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ProductMediaRepository media;
    private final UserRepository users;

    @Transactional(readOnly = true)
    public WishlistDtos.PageResponse list(Authentication auth, int page, int size) {
        if (page < 0 || size < 1 || size > 100) throw CustomerAccountException.badRequest("INVALID_PAGE", "page hoặc size không hợp lệ", null);
        var result = wishlists.findByUserIdOrderByIdDesc(userId(auth), PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id")));
        List<WishlistDtos.Item> content = result.getContent().stream().map(w -> item(w.getProductId())).toList();
        return new WishlistDtos.PageResponse(content, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public WishlistDtos.IdsResponse ids(Authentication auth) {
        return new WishlistDtos.IdsResponse(wishlists.findByUserIdOrderByIdDesc(userId(auth)).stream().map(Wishlist::getProductId).toList());
    }

    @Transactional
    public void add(Authentication auth, Long productId) {
        Product p = product(productId);
        if (!isProductVisible(p)) throw CustomerAccountException.notFound("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm đang bán");
        if (!wishlists.existsByUserIdAndProductId(userId(auth), productId)) { Wishlist w = new Wishlist(); w.setUserId(userId(auth)); w.setProductId(productId); wishlists.save(w); }
    }

    @Transactional
    public void remove(Authentication auth, Long productId) { wishlists.deleteByUserIdAndProductId(userId(auth), productId); }

    private WishlistDtos.Item item(Long productId) {
        Product p = product(productId);
        List<ProductVariant> vs = variants.findByProductId(productId);
        ProductVariant cheapest = vs.stream().filter(v -> v.getPrice() != null).min(Comparator.comparing(ProductVariant::getPrice)).orElse(null);
        ProductVariant available = vs.stream().filter(v -> v.getStockQty() > 0).min(Comparator.comparing(ProductVariant::getPrice)).orElse(null);
        String image = media.findByProductIdOrderBySortOrderAscIdAsc(productId).stream().findFirst().map(ProductMedia::getUrl).orElse(null);
        return new WishlistDtos.Item(productId, p.getName(), image, cheapest == null ? null : cheapest.getPrice(),
                vs.size() > 1, java.math.BigDecimal.ZERO, 0, isProductVisible(p) && available != null,
                isProductVisible(p) && available != null ? available.getId() : null);
    }

    private Product product(Long id) { return products.findById(id).orElseThrow(() -> CustomerAccountException.notFound("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm")); }
    private boolean isProductVisible(Product p) { return "VISIBLE".equals(p.getStatus()) && p.getShop() != null && p.getShop().getStatus() == ShopStatus.ACTIVE; }
    private Long userId(Authentication auth) { return users.findByEmail(auth.getName()).or(() -> users.findByPhone(auth.getName())).orElseThrow(() -> CustomerAccountException.unauthorized("Không xác định được tài khoản")).getId(); }
}
