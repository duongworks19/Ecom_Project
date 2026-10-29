package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.dto.seller.product.SellerProductVariantDto;
import com.vic.ecom.dto.seller.product.StockUpdateRequest;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.ProductVariant;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.services.seller.product.SellerShopResolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/seller/products/{id}/stock")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerProductStockController {

    private final ProductRepository productRepository;
    private final SellerShopResolverService shopResolverService;

    @PatchMapping
    @PutMapping
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<ApiResponse<SellerProductDetailDto>> updateStock(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @PathVariable Long id,
            @RequestBody StockUpdateRequest req
    ) {
        Shop shop = shopResolverService.resolveCurrentShop(authentication, userId);
        if (shop == null) {
            return ResponseEntity.badRequest().body(ApiResponse.fail("Không tìm thấy gian hàng của người bán"));
        }

        Product product = productRepository.findByIdAndShopId(id, shop.getId())
                .orElse(null);
        if (product == null) {
            return ResponseEntity.notFound().build();
        }

        Integer newStock = req.getQ() != null ? req.getQ() : req.getStock();
        Integer newThreshold = req.getL() != null ? req.getL() : req.getThreshold();

        if (req.getVariants() != null && !req.getVariants().isEmpty()) {
            for (SellerProductVariantDto v : req.getVariants()) {
                if (v.getSku() != null && !v.getSku().isBlank()) {
                    product.getVariants().stream()
                            .filter(pv -> v.getSku().trim().equalsIgnoreCase(pv.getSku()))
                            .findFirst()
                            .ifPresent(pv -> {
                                if (v.getQ() != null) pv.setStockQty(v.getQ());
                                if (v.getL() != null) pv.setLowStockThreshold(v.getL());
                            });
                }
            }
        } else if (req.getSku() != null && !req.getSku().isBlank()) {
            product.getVariants().stream()
                    .filter(pv -> req.getSku().trim().equalsIgnoreCase(pv.getSku()))
                    .findFirst()
                    .ifPresent(pv -> {
                        if (newStock != null) pv.setStockQty(newStock);
                        if (newThreshold != null) pv.setLowStockThreshold(newThreshold);
                    });
        } else if (product.getVariants().size() == 1) {
            ProductVariant pv = product.getVariants().get(0);
            if (newStock != null) pv.setStockQty(newStock);
            if (newThreshold != null) pv.setLowStockThreshold(newThreshold);
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

        SellerProductDetailDto result = SellerProductDetailDto.builder()
                .id(saved.getId())
                .n(saved.getName())
                .c(saved.getCategory())
                .d(saved.getDescription())
                .s(saved.getStatus())
                .imageUrl(saved.getImageUrl())
                .v(savedVariants)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tồn kho thành công", result));
    }
}
