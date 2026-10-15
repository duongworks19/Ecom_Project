package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerDashboardResponse {
    private Long shopId;
    private String shopName;
    private String shopAvatarLetter;
    private String shopLogo;
    private boolean adminApproved;
    private String greetingTitle;
    private String currentDateText;
    private int totalUrgentTasks;
    private int unreadNotifications;

    private int completedSteps;
    private int totalSteps;

    private SellerDashboardStatsDto stats;
    private SellerTodoDto todos;

    private List<SellerRevenuePointDto> revenueChart7Days;
    private List<SellerRevenuePointDto> revenueChart30Days;
    private List<SellerLowStockDto> lowStockProducts;
    private List<SellerRecentOrderDto> recentOrders;
    private List<SellerProductDto> products;
    private List<SellerVoucherDto> vouchers;
    private List<SellerPromotionDto> promotions;
    private List<SellerReviewQuestionDto> reviews;
    private SellerShopProfileDto shopProfile;
}
