package com.vic.ecom.services.seller.product;

import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.dto.seller.product.SellerProductUpdateRequest;
import com.vic.ecom.dto.seller.product.SellerProductVariantDto;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.ProductVariant;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerProductUpdateService {

    private final ProductRepository productRepository;
    private final SellerShopResolverService shopResolverService;

    @Transactional
    public SellerProductDetailDto updateProduct(Authentication auth, Long userId, Long productId, SellerProductUpdateRequest req) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, userId);
        if (shop == null) {
            throw new IllegalArgumentException("Không tìm thấy gian hàng của người bán");
        }

        Product product = productRepository.findByIdAndShopId(productId, shop.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy sản phẩm cần cập nhật (id=" + productId + ")"));

        String newName = req.resolveName();
        if (!newName.isBlank()) {
            product.setName(newName);
        }

        product.setCategory(req.resolveCategory());
        product.setDescription(req.resolveDescription());
        product.setStatus(req.resolveStatus());
        product.setUpdatedAt(LocalDateTime.now());
        if (req.getImageUrl() != null && !req.getImageUrl().isBlank()) {
            product.setImageUrl(req.getImageUrl());
        }

        List<SellerProductVariantDto> variants = req.resolveVariants();
        if (!variants.isEmpty()) {
            product.getVariants().clear();
            for (SellerProductVariantDto v : variants) {
                ProductVariant pv = new ProductVariant();
                pv.setVariantName(v.getA() != null && !v.getA().isBlank() ? v.getA().trim() : "Mặc định");
                pv.setSku(v.getSku() != null && !v.getSku().isBlank() ? v.getSku().trim() : "SKU-" + System.currentTimeMillis() % 10000);
                pv.setPrice(v.getP() != null ? v.getP() : BigDecimal.ZERO);
                pv.setStockQty(v.getQ() != null ? v.getQ() : 0);
                pv.setLowStockThreshold(v.getL() != null ? v.getL() : 5);
                pv.setSoldCount(0);
                pv.setImageUrl(product.getImageUrl());
                product.addVariant(pv);
            }
        }

        Product saved = productRepository.save(product);

        List<SellerProductVariantDto> savedVariants = saved.getVariants().stream()
                .map(v -> SellerProductVariantDto.builder()
                        .sku(v.getSku())
                        .a(v.getVariantName())
                        .p(v.getPrice())
                        .q(v.getStockQty())
                        .l(v.getLowStockThreshold())
                        .build())
                .collect(Collectors.toList());

        int totalSold = saved.getVariants().stream()
                .mapToInt(v -> v.getSoldCount() != null ? v.getSoldCount() : 0)
                .sum();

        return SellerProductDetailDto.builder()
                .id(saved.getId())
                .n(saved.getName())
                .c(saved.getCategory())
                .d(saved.getDescription())
                .s(saved.getStatus())
                .sold(totalSold)
                .imageUrl(saved.getImageUrl())
                .v(savedVariants)
                .build();
    }
}
