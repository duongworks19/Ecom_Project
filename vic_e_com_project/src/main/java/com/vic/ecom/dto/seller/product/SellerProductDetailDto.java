package com.vic.ecom.dto.seller.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductDetailDto {
    private Long id;
    private String n; // name
    private String c; // category
    private String d; // description
    private String s; // status: VISIBLE, HIDDEN, DRAFT
    private Integer sold; // sold count
    private String imageUrl;
    
    // List of variants
    @Builder.Default
    private List<SellerProductVariantDto> v = new ArrayList<>();

    // Friendly getters for UI standard naming
    public String getName() {
        return n;
    }

    public String getCategory() {
        return c;
    }

    public String getDescription() {
        return d;
    }

    public String getStatus() {
        return s;
    }

    public Integer getSoldCount() {
        return sold;
    }

    public List<SellerProductVariantDto> getVariants() {
        return v;
    }
}
