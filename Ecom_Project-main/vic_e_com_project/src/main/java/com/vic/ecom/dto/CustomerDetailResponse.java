package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record CustomerDetailResponse(
        Profile profile,
        List<AddressItem> addresses,
        PurchaseSummary purchaseSummary
) {
    public record Profile(
            Long id,
            String fullName,
            String email,
            String phone,
            String avatarUrl,
            String status,
            LocalDateTime createdAt
    ) {
    }

    public record AddressItem(
            Long id,
            String receiverName,
            String phone,
            String addressDetail,
            boolean isDefault
    ) {
    }

    public record PurchaseSummary(
            long totalOrders,
            long cancelledOrders,
            BigDecimal totalSpent,
            LocalDateTime lastOrderAt
    ) {
    }
}
