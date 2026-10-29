package com.vic.ecom.services.seller.product;

import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.dto.seller.product.SellerProductUpdateRequest;
import com.vic.ecom.dto.seller.product.SellerProductVariantDto;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.ProductVariant;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.ProductMedia;
import com.vic.ecom.enums.ProductMediaType;
import com.vic.ecom.repository.ProductMediaRepository;
import com.vic.ecom.repository.CategoryRepository;
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
    private final ProductMediaRepository mediaRepository;
    private final CategoryRepository categoryRepository;

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
        if (req.getCategoryId() != null) categoryRepository.findById(req.getCategoryId()).ifPresent(c -> product.setCategoryId(c.getId()));
        product.setDescription(req.resolveDescription());
        product.setStatus(req.resolveStatus());
        product.setUpdatedAt(LocalDateTime.now());
        if (req.getImageUrl() != null && !req.getImageUrl().isBlank()) {
            product.setImageUrl(req.getImageUrl());
        }

        List<SellerProductVariantDto> variants = req.resolveVariants();
        if (!variants.isEmpty()) {
            if (product.getVariants().size() == 1 && variants.size() == 1) {
                ProductVariant pv = product.getVariants().get(0);
                SellerProductVariantDto v = variants.get(0);
                if (v.getA() != null && !v.getA().isBlank()) pv.setVariantName(v.getA().trim());
                if (v.getSku() != null && !v.getSku().isBlank()) pv.setSku(v.getSku().trim());
                if (v.getP() != null) pv.setPrice(v.getP());
                if (v.getQ() != null) pv.setStockQty(v.getQ());
                if (v.getL() != null) pv.setLowStockThreshold(v.getL());
            } else {
                java.util.Map<String, ProductVariant> existingBySku = product.getVariants().stream()
                        .filter(pv -> pv.getSku() != null && !pv.getSku().isBlank())
                        .collect(Collectors.toMap(ProductVariant::getSku, pv -> pv, (a, b) -> a));

                java.util.Set<String> incomingSkus = new java.util.HashSet<>();
                for (SellerProductVariantDto v : variants) {
                    String sku = (v.getSku() != null && !v.getSku().isBlank()) ? v.getSku().trim() : null;
                    if (sku != null) incomingSkus.add(sku);
                    ProductVariant pv = (sku != null) ? existingBySku.get(sku) : null;
                    if (pv != null) {
                        if (v.getA() != null && !v.getA().isBlank()) pv.setVariantName(v.getA().trim());
                        if (v.getP() != null) pv.setPrice(v.getP());
                        if (v.getQ() != null) pv.setStockQty(v.getQ());
                        if (v.getL() != null) pv.setLowStockThreshold(v.getL());
                    } else {
                        ProductVariant newPv = new ProductVariant();
                        newPv.setVariantName(v.getA() != null && !v.getA().isBlank() ? v.getA().trim() : "Mặc định");
                        newPv.setSku(sku != null ? sku : "SKU-" + System.currentTimeMillis() % 10000);
                        newPv.setPrice(v.getP() != null ? v.getP() : BigDecimal.ZERO);
                        newPv.setStockQty(v.getQ() != null ? v.getQ() : 0);
                        newPv.setLowStockThreshold(v.getL() != null ? v.getL() : 5);
                        newPv.setSoldCount(0);
                        newPv.setImageUrl(product.getImageUrl());
                        product.addVariant(newPv);
                    }
                }
                if (!incomingSkus.isEmpty()) {
                    product.getVariants().removeIf(pv -> pv.getSku() != null && !incomingSkus.contains(pv.getSku()));
                }
            }
        }

        Product saved = productRepository.save(product);
        if (req.getMedia() != null && !req.getMedia().isEmpty()) {
            mediaRepository.deleteByProductId(saved.getId()); int order=0;
            for (var item:req.getMedia()) { if(item.getUrl()==null || item.getUrl().isBlank()) continue; ProductMedia m=new ProductMedia(); m.setProductId(saved.getId()); m.setUrl(item.getUrl().trim()); m.setType(item.getType()==null?ProductMediaType.IMAGE:item.getType()); m.setSortOrder(item.getSortOrder()==null?order++:item.getSortOrder()); mediaRepository.save(m); }
        }

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
