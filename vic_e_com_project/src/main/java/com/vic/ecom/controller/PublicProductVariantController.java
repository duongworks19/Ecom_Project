package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.ProductVariantDtos;
import com.vic.ecom.dto.PublicProductDetail;
import com.vic.ecom.dto.ProductMediaDtos;
import com.vic.ecom.dto.search.SearchProductItem;
import com.vic.ecom.services.PublicProductVariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vic.ecom.entity.Product;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ProductMediaRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class PublicProductVariantController {
    private final PublicProductVariantService service;
    private final ProductRepository productRepository;
    private final ProductMediaRepository mediaRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SearchProductItem>>> listAllPublicProducts() {
        List<Product> products = productRepository.findAllActiveProductsWithVariants();
        List<SearchProductItem> items = products.stream()
                .map(p -> {
                    BigDecimal minPrice = BigDecimal.ZERO;
                    int totalSold = 0;
                    if (p.getVariants() != null && !p.getVariants().isEmpty()) {
                        minPrice = p.getVariants().stream()
                                .map(v -> v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO)
                                .filter(pr -> pr.compareTo(BigDecimal.ZERO) > 0)
                                .min(BigDecimal::compareTo)
                                .orElse(BigDecimal.ZERO);
                        totalSold = p.getVariants().stream()
                                .mapToInt(v -> v.getSoldCount() != null ? v.getSoldCount() : 0)
                                .sum();
                    }
                    return SearchProductItem.builder()
                            .id(p.getId())
                            .name(p.getName())
                            .category(p.getCategory() != null ? p.getCategory() : "Khác")
                            .description(p.getDescription())
                            .imageUrl(p.getImageUrl())
                            .price(minPrice)
                            .shopId(p.getShop() != null ? p.getShop().getId() : null)
                            .shopName(p.getShop() != null ? p.getShop().getName() : "VICMART Shop")
                            .ratingAvg(p.getShop() != null && p.getShop().getRatingAvg() != null ? p.getShop().getRatingAvg() : BigDecimal.valueOf(5.0))
                            .soldCount(totalSold)
                            .build();
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.ok("Danh sách sản phẩm", items));
    }

    @GetMapping("/{productId}")
    public ResponseEntity<ApiResponse<PublicProductDetail>> getProductDetail(@PathVariable Long productId) {
        Product p = productRepository.findById(productId).orElse(null);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }
        ProductVariantDtos.Response varRes = service.list(productId);
        List<ProductVariantDtos.Item> variants = varRes != null ? varRes.variants() : List.of();
        List<ProductMediaDtos.Item> media = ProductMediaDtos.fromEntities(
                mediaRepository.findByProductIdOrderBySortOrderAscIdAsc(productId));

        BigDecimal minPrice = BigDecimal.ZERO;
        int totalStock = 0;
        if (variants != null && !variants.isEmpty()) {
            minPrice = variants.stream()
                    .map(ProductVariantDtos.Item::price)
                    .filter(pr -> pr != null && pr.compareTo(BigDecimal.ZERO) > 0)
                    .min(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);
            totalStock = variants.stream()
                    .mapToInt(v -> v.stockQty() != null ? v.stockQty() : 0)
                    .sum();
        }

        PublicProductDetail detail = PublicProductDetail.builder()
                .id(p.getId())
                .name(p.getName())
                .category(p.getCategory() != null ? p.getCategory() : "Khác")
                .description(p.getDescription())
                .imageUrl(p.getImageUrl())
                .media(media)
                .price(minPrice)
                .stock(totalStock)
                .soldCount(0)
                .shopId(p.getShop() != null ? p.getShop().getId() : null)
                .shopName(p.getShop() != null ? p.getShop().getName() : "VICMART Shop")
                .ratingAvg(p.getShop() != null && p.getShop().getRatingAvg() != null ? p.getShop().getRatingAvg() : BigDecimal.valueOf(5.0))
                .variants(variants)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Chi tiết sản phẩm", detail));
    }

    @GetMapping("/{productId}/variants")
    public ResponseEntity<ApiResponse<ProductVariantDtos.Response>> list(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok("Danh sách biến thể sản phẩm", service.list(productId)));
    }
}
