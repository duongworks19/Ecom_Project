package com.vic.ecom.dto;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record AdminDashboardResponse(
        PendingTasks pendingTasks,
        OrderStatusSummary orderStatus,
        List<DailyRevenueItem> revenueLast7Days,
        List<RecentActivityItem> recentActivities
) {
    public record PendingTasks(
            long pendingVendors,
            long ordersAwaitingShipper,
            long failedDeliveriesAwaitingDecision,
            long pendingReturns
    ) {}

    public record OrderStatusSummary(
            long total,
            long pending,
            long preparing,
            long shipping,
            long delivered,
            long cancelled
    ) {}

    public record DailyRevenueItem(
            @JsonFormat(pattern = "yyyy-MM-dd")
            LocalDate date,
            BigDecimal amount
    ) {}

    public record RecentActivityItem(
            String type,
            String title,
            Long referenceId,
            @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
            LocalDateTime occurredAt
    ) {}
}
