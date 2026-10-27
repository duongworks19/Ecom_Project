package com.vic.ecom.services;

import com.vic.ecom.dto.ProductVariantDtos;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.ProductVariant;
import com.vic.ecom.entity.VariantAttribute;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ProductVariantRepository;
import com.vic.ecom.repository.VariantAttributeRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PublicProductVariantService {
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final VariantAttributeRepository attributes;

    @Transactional(readOnly = true)
    public ProductVariantDtos.Response list(Long productId) {
        Product product = products.findById(productId)
                .orElseThrow(() -> CustomerAccountException.notFound("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm"));
        if (!isPublic(product)) {
            throw CustomerAccountException.notFound("PRODUCT_NOT_FOUND", "Không tìm thấy sản phẩm");
        }

        List<ProductVariant> rows = variants.findByProductId(productId);
        Map<Long, String> labels = attributes.findByVariantIdInOrderByIdAsc(
                        rows.stream().map(ProductVariant::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(
                        VariantAttribute::getVariantId,
                        Collectors.mapping(VariantAttribute::getAttrValue, Collectors.joining(", "))));

        List<ProductVariantDtos.Item> result = rows.stream().map(v -> new ProductVariantDtos.Item(
                v.getId(),
                v.getSku(),
                labels.getOrDefault(v.getId(), v.getSku()),
                v.getPrice(),
                v.getStockQty(),
                v.getStockQty() > 0
        )).toList();
        return new ProductVariantDtos.Response(productId, result);
    }

    private boolean isPublic(Product product) {
        return "VISIBLE".equals(product.getStatus())
                && product.getShop() != null
                && product.getShop().getStatus() == ShopStatus.ACTIVE;
    }
}
