package com.vic.ecom.services.seller.product;

import com.vic.ecom.dto.seller.product.SellerProductStatusRequest;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SellerProductStatusService {

    private final ProductRepository productRepository;
    private final SellerShopResolverService shopResolverService;

    @Transactional
    public String toggleProductStatus(Authentication auth, Long userId, Long productId, SellerProductStatusRequest req) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, userId);
        if (shop == null) {
            throw new IllegalArgumentException("Không tìm thấy gian hàng của người bán");
        }

        Product product = productRepository.findByIdAndShopId(productId, shop.getId())
                .orElseGet(() -> productRepository.findById(productId)
                        .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm (id=" + productId + ")")));

        String targetStatus = (req != null && req.getStatus() != null && !req.getStatus().isBlank())
                ? req.getStatus().trim().toUpperCase()
                : ("VISIBLE".equalsIgnoreCase(product.getStatus()) ? "HIDDEN" : "VISIBLE");

        product.setStatus(targetStatus);
        productRepository.save(product);

        return targetStatus;
    }
}
