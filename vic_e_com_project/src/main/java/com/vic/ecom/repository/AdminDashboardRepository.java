package com.vic.ecom.repository;

import com.vic.ecom.dto.AdminDashboardResponse.DailyRevenueItem;
import com.vic.ecom.dto.AdminDashboardResponse.OrderStatusSummary;
import com.vic.ecom.dto.AdminDashboardResponse.PendingTasks;
import com.vic.ecom.dto.AdminDashboardResponse.RecentActivityItem;

import java.time.LocalDate;
import java.util.List;

public interface AdminDashboardRepository {

    PendingTasks findPendingTasks();

    OrderStatusSummary findOrderStatusSummary();

    List<DailyRevenueItem> findRevenueLast7Days(LocalDate todayVn);

    List<RecentActivityItem> findRecentActivities(int limit);
}

