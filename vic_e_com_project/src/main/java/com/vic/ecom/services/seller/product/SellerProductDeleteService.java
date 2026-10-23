package com.vic.ecom.services.seller.product;

import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerProductDeleteService {

    private final ProductRepository productRepository;
    private final SellerShopResolverService shopResolverService;

    @Transactional
    public void deleteProduct(Authentication auth, Long userId, Long productId) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, userId);
        if (shop == null) {
            throw new IllegalArgumentException("Không tìm thấy gian hàng của người bán");
        }

        Product product = productRepository.findByIdAndShopId(productId, shop.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm cần xóa (id=" + productId + ")"));

        product.setStatus("DELETED");
        productRepository.save(product);
    }
}
