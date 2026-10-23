package com.vic.ecom.dto.seller.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductVariantDto {
    private String sku;
    private String a; // Variant name / attribute (e.g., "Nâu", "60cm", "M")
    private BigDecimal p; // Price
    private Integer q; // Stock quantity
    private Integer l; // Low stock threshold
}
