package com.vic.ecom.services.seller.product;

import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.dto.seller.product.SellerProductVariantDto;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerProductListService {

    private final ProductRepository productRepository;
    private final SellerShopResolverService shopResolverService;

    @Transactional(readOnly = true)
    public List<SellerProductDetailDto> listProducts(Authentication auth, Long userId, String status, String keyword) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, userId);
        if (shop == null) return List.of();

        List<Product> products;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            products = productRepository.findByShopIdAndStatusOrderByIdDesc(shop.getId(), status.trim().toUpperCase());
        } else {
            products = productRepository.findByShopIdAndStatusNotOrderByIdDesc(shop.getId(), "DELETED");
        }

        if (keyword != null && !keyword.isBlank()) {
            String lower = keyword.trim().toLowerCase();
            products = products.stream()
                    .filter(p -> (p.getName() != null && p.getName().toLowerCase().contains(lower))
                            || (p.getCategory() != null && p.getCategory().toLowerCase().contains(lower))
                            || (p.getVariants() != null && p.getVariants().stream().anyMatch(v -> v.getSku() != null && v.getSku().toLowerCase().contains(lower))))
                    .collect(Collectors.toList());
        }

        List<SellerProductDetailDto> result = new ArrayList<>();
        for (Product p : products) {
            List<SellerProductVariantDto> variants = (p.getVariants() == null || p.getVariants().isEmpty())
                    ? List.of()
                    : p.getVariants().stream()
                    .map(v -> SellerProductVariantDto.builder()
                            .sku(v.getSku())
                            .a(v.getVariantName() != null ? v.getVariantName() : "Mặc định")
                            .p(v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO)
                            .q(v.getStockQty() != null ? v.getStockQty() : 0)
                            .l(v.getLowStockThreshold() != null ? v.getLowStockThreshold() : 5)
                            .build())
                    .collect(Collectors.toList());

            int totalSold = (p.getVariants() == null) ? 0 : p.getVariants().stream()
                    .mapToInt(v -> v.getSoldCount() != null ? v.getSoldCount() : 0)
                    .sum();

            result.add(SellerProductDetailDto.builder()
                    .id(p.getId())
                    .n(p.getName())
                    .c(p.getCategory() != null ? p.getCategory() : (p.getCategoryEntity() != null ? p.getCategoryEntity().getName() : ""))
                    .categoryId(p.getCategoryId())
                    .d(p.getDescription() != null ? p.getDescription() : "")
                    .s(p.getStatus() != null ? p.getStatus() : "VISIBLE")
                    .sold(totalSold)
                    .imageUrl(p.getImageUrl())
                    .v(variants)
                    .build());
        }

        return result;
    }
}
