package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerLowStockDto {
    private Long id;
    private String name;
    private String variant;
    private String sku;
    private Integer remainingQuantity;
    private String thumbnailColor;
    private String imageUrl;
    private String badgeType; // "danger" (< 5) or "warning" (>= 5)
}
