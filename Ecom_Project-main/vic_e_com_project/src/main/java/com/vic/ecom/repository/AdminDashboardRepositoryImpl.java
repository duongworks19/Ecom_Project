package com.vic.ecom.repository;

import com.vic.ecom.dto.AdminDashboardResponse.DailyRevenueItem;
import com.vic.ecom.dto.AdminDashboardResponse.OrderStatusSummary;
import com.vic.ecom.dto.AdminDashboardResponse.PendingTasks;
import com.vic.ecom.dto.AdminDashboardResponse.RecentActivityItem;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
@RequiredArgsConstructor
public class AdminDashboardRepositoryImpl implements AdminDashboardRepository {

    private final JdbcClient jdbcClient;

    @Override
    public PendingTasks findPendingTasks() {
        String sql = """
                SELECT
                    (SELECT COUNT(*) FROM vendors WHERE approval_status = 'PENDING') AS pending_vendors,
                    (SELECT COUNT(*) FROM orders o
                     WHERE o.status = 'PACKED'
                       AND NOT EXISTS (
                           SELECT 1 FROM shipments s
                           WHERE s.order_id = o.id
                             AND s.status IN ('ASSIGNED', 'PICKED_UP', 'DELIVERING')
                       )) AS orders_awaiting_shipper,
                    (SELECT COUNT(*) FROM delivery_failures WHERE next_action IS NULL) AS failed_deliveries,
                    (SELECT COUNT(*) FROM return_requests WHERE status = 'PENDING') AS pending_returns
                """;
        return jdbcClient.sql(sql)
                .query((rs, rowNum) -> new PendingTasks(
                        rs.getLong("pending_vendors"),
                        rs.getLong("orders_awaiting_shipper"),
                        rs.getLong("failed_deliveries"),
                        rs.getLong("pending_returns")
                ))
                .single();
    }

    @Override
    public OrderStatusSummary findOrderStatusSummary() {
        String sql = """
                SELECT
                    COUNT(*) AS total,
                    COUNT(*) FILTER (WHERE status = 'PENDING') AS pending,
                    COUNT(*) FILTER (WHERE status IN ('CONFIRMED', 'PREPARING', 'PACKED')) AS preparing,
                    COUNT(*) FILTER (WHERE status = 'SHIPPING') AS shipping,
                    COUNT(*) FILTER (WHERE status = 'DELIVERED') AS delivered,
                    COUNT(*) FILTER (WHERE status IN ('CANCELLED', 'REJECTED')) AS cancelled
                FROM orders
                """;
        return jdbcClient.sql(sql)
                .query((rs, rowNum) -> new OrderStatusSummary(
                        rs.getLong("total"),
                        rs.getLong("pending"),
                        rs.getLong("preparing"),
                        rs.getLong("shipping"),
                        rs.getLong("delivered"),
                        rs.getLong("cancelled")
                ))
                .single();
    }

    @Override
    public List<DailyRevenueItem> findRevenueLast7Days(LocalDate todayVn) {
        LocalDate startDate = todayVn.minusDays(6);
        LocalDateTime fromTime = startDate.atStartOfDay();
        LocalDateTime toTime = todayVn.plusDays(1).atStartOfDay();

        String sql = """
                SELECT
                    d.day::date AS rev_date,
                    COALESCE(SUM(o.total_amount), 0.00) AS amount
                FROM generate_series(CAST(:startDate AS date), CAST(:endDate AS date), INTERVAL '1 day') AS d(day)
                LEFT JOIN orders o
                    ON o.status = 'DELIVERED'
                   AND o.delivered_at >= :fromTime
                   AND o.delivered_at < :toTime
                   AND o.delivered_at >= d.day
                   AND o.delivered_at < d.day + INTERVAL '1 day'
                GROUP BY d.day
                ORDER BY d.day ASC
                """;
        return jdbcClient.sql(sql)
                .param("startDate", startDate)
                .param("endDate", todayVn)
                .param("fromTime", Timestamp.valueOf(fromTime))
                .param("toTime", Timestamp.valueOf(toTime))
                .query((rs, rowNum) -> new DailyRevenueItem(
                        rs.getObject("rev_date", LocalDate.class),
                        rs.getBigDecimal("amount")
                ))
                .list();
    }

    @Override
    public List<RecentActivityItem> findRecentActivities(int limit) {
        String sql = """
                SELECT type, title, reference_id, occurred_at
                FROM (
                    (SELECT 'VENDOR' AS type,
                            'Vendor mới đăng ký gian hàng, chờ duyệt' AS title,
                            v.id AS reference_id,
                            u.created_at AS occurred_at
                     FROM vendors v
                     JOIN users u ON u.id = v.user_id
                     WHERE v.approval_status = 'PENDING'
                     ORDER BY u.created_at DESC
                     LIMIT :limit)
                    UNION ALL
                    (SELECT 'ORDER' AS type,
                            'Đơn ' || o.order_code || ' đã đóng gói, chờ gán shipper' AS title,
                            o.id AS reference_id,
                            COALESCE(
                                (SELECT MAX(osh.changed_at)
                                 FROM order_status_history osh
                                 WHERE osh.order_id = o.id
                                   AND osh.to_status = 'PACKED'),
                                o.created_at
                            ) AS occurred_at
                     FROM orders o
                     WHERE o.status = 'PACKED'
                       AND NOT EXISTS (
                           SELECT 1 FROM shipments s
                           WHERE s.order_id = o.id
                             AND s.status IN ('ASSIGNED', 'PICKED_UP', 'DELIVERING')
                       )
                     ORDER BY occurred_at DESC
                     LIMIT :limit)
                    UNION ALL
                    (SELECT 'SHIPPING' AS type,
                            'Shipper báo giao thất bại, chờ quyết định' AS title,
                            df.id AS reference_id,
                            df.created_at AS occurred_at
                     FROM delivery_failures df
                     WHERE df.next_action IS NULL
                     ORDER BY df.created_at DESC
                     LIMIT :limit)
                    UNION ALL
                    (SELECT 'RETURN' AS type,
                            'Khách gửi yêu cầu đổi trả sản phẩm' AS title,
                            rr.id AS reference_id,
                            rr.created_at AS occurred_at
                     FROM return_requests rr
                     WHERE rr.status = 'PENDING'
                     ORDER BY rr.created_at DESC
                     LIMIT :limit)
                ) combined
                ORDER BY occurred_at DESC, reference_id DESC
                LIMIT :limit
                """;
        return jdbcClient.sql(sql)
                .param("limit", limit)
                .query((rs, rowNum) -> new RecentActivityItem(
                        rs.getString("type"),
                        rs.getString("title"),
                        rs.getLong("reference_id"),
                        rs.getTimestamp("occurred_at").toLocalDateTime()
                ))
                .list();
    }
}
