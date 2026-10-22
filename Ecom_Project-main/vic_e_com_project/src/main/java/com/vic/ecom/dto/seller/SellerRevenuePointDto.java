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
public class SellerRevenuePointDto {
    private String label;             // "T5", "T6", ... or "01/10", ...
    private Double valueInMillions;   // e.g. 4.8
    private BigDecimal exactRevenue;  // e.g. 4820000
    private Integer orderCount;       // e.g. 23
}
