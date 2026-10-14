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
public class SellerDashboardStatsDto {
    private BigDecimal todayRevenue;
    private Double revenueGrowthPercent;
    private Integer totalOrdersToday;
    private Integer orderGrowthCount;
    private Double cancellationRate;
    private Double cancellationRateDiff;
    private BigDecimal averageRating;
    private Integer totalReviews;
}
