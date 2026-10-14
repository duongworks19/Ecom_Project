package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerPromotionDto {
    private Long id;
    private String name;
    private Integer discountPercent;
    private Integer productCount;
    private String timeRange;
    private String status;
}
