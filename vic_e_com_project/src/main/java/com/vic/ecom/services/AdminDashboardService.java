package com.vic.ecom.services;

import com.vic.ecom.dto.AdminDashboardResponse;
import com.vic.ecom.repository.AdminDashboardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    public static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private final AdminDashboardRepository dashboardRepository;
    private Clock clock = Clock.system(VN_ZONE);

    public void setClock(Clock clock) {
        this.clock = clock;
    }

    @Transactional(readOnly = true)
    public AdminDashboardResponse getDashboard(Integer limitParam) {
        int limit = (limitParam == null || limitParam <= 0) ? 10 : Math.min(limitParam, 50);
        LocalDate todayVn = LocalDate.now(clock.withZone(VN_ZONE));

        return new AdminDashboardResponse(
                dashboardRepository.findPendingTasks(),
                dashboardRepository.findOrderStatusSummary(),
                dashboardRepository.findRevenueLast7Days(todayVn),
                dashboardRepository.findRecentActivities(limit)
        );
    }
}
