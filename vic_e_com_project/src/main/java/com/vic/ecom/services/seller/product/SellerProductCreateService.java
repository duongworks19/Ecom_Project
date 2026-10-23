package com.vic.ecom.services.seller.product;

import com.vic.ecom.dto.seller.product.SellerProductCreateRequest;
import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
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
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerProductCreateService {

    private final ProductRepository productRepository;
    private final SellerShopResolverService shopResolverService;

    @Transactional
    public SellerProductDetailDto createProduct(Authentication auth, Long userId, SellerProductCreateRequest req) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, userId);
        if (shop == null) {
            throw new IllegalArgumentException("Không tìm thấy gian hàng của người bán");
        }

        String name = req.resolveName();
        if (name.isBlank()) {
            throw new IllegalArgumentException("Tên sản phẩm không được để trống");
        }

        String category = req.resolveCategory();
        String description = req.resolveDescription();
        String status = req.resolveStatus();
        String imageUrl = (req.getImageUrl() != null && !req.getImageUrl().isBlank())
                ? req.getImageUrl().trim()
                : "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=300&q=80";

        List<SellerProductVariantDto> variants = req.resolveVariants();
        if (variants.isEmpty()) {
            variants = List.of(SellerProductVariantDto.builder()
                    .sku("SP-" + System.currentTimeMillis() % 10000)
                    .a("Mặc định")
                    .p(new BigDecimal("100000"))
                    .q(10)
                    .l(5)
                    .build());
        }

        Product product = new Product();
        product.setShop(shop);
        product.setName(name);
        product.setCategory(category);
        product.setDescription(description);
        product.setStatus(status);
        product.setImageUrl(imageUrl);

        for (SellerProductVariantDto v : variants) {
            ProductVariant pv = new ProductVariant();
            pv.setVariantName(v.getA() != null && !v.getA().isBlank() ? v.getA().trim() : "Mặc định");
            pv.setSku(v.getSku() != null && !v.getSku().isBlank() ? v.getSku().trim() : "SKU-" + System.currentTimeMillis() % 10000);
            pv.setPrice(v.getP() != null ? v.getP() : BigDecimal.ZERO);
            pv.setStockQty(v.getQ() != null ? v.getQ() : 0);
            pv.setLowStockThreshold(v.getL() != null ? v.getL() : 5);
            pv.setSoldCount(0);
            pv.setImageUrl(imageUrl);
            product.addVariant(pv);
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

        return SellerProductDetailDto.builder()
                .id(saved.getId())
                .n(saved.getName())
                .c(saved.getCategory())
                .d(saved.getDescription())
                .s(saved.getStatus())
                .sold(0)
                .imageUrl(saved.getImageUrl())
                .v(savedVariants)
                .build();
    }
}
