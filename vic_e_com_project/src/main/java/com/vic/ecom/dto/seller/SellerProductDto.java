package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductDto {
    private Long id;
    private String name;
    private String variant;
    private String sku;
    private String category;
    private BigDecimal price;
    private Integer stock;
    private Integer soldCount;
    private String thumbnailColor;
    private String imageUrl;
    private String status; // "ACTIVE", "LOW_STOCK", "HIDDEN"
}
