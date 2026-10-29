package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.search.SearchProductItem;
import com.vic.ecom.dto.search.SearchResultResponse;
import com.vic.ecom.dto.search.SearchShopItem;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/search")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SearchController {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<SearchResultResponse>> search(
            @RequestParam(required = false, defaultValue = "") String q,
            @RequestParam(required = false, defaultValue = "10") int limit
    ) {
        String keyword = (q != null) ? q.trim() : "";
        List<Shop> matchedShops;
        List<Product> matchedProducts;

        if (keyword.isBlank()) {
            matchedShops = shopRepository.findByStatus(ShopStatus.ACTIVE);
            matchedProducts = productRepository.findAllActiveProductsWithVariants();
        } else {
            matchedShops = shopRepository.searchActiveShops(keyword);
            matchedProducts = productRepository.searchPublicProducts(keyword);
        }

        List<SearchShopItem> shopItems = matchedShops.stream()
                .limit(limit)
                .map(s -> SearchShopItem.builder()
                        .id(s.getId())
                        .name(s.getName())
                        .logo(s.getLogo())
                        .description(s.getDescription())
                        .pickupAddress(s.getPickupAddress())
                        .ratingAvg(s.getRatingAvg() != null ? s.getRatingAvg() : BigDecimal.valueOf(5.0))
                        .productCount((int) productRepository.countByShopId(s.getId()))
                        .build())
                .collect(Collectors.toList());

        List<SearchProductItem> productItems = matchedProducts.stream()
                .limit(limit)
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

        SearchResultResponse result = SearchResultResponse.builder()
                .query(keyword)
                .shops(shopItems)
                .products(productItems)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Tìm kiếm dữ liệu thành công", result));
    }
}
