package com.vic.ecom.repository;

import com.vic.ecom.dto.CustomerListItemResponse;
import com.vic.ecom.dto.CustomerPageResponse;
import com.vic.ecom.dto.CustomerSummaryResponse;
import com.vic.ecom.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
@RequiredArgsConstructor
public class AdminCustomerRepository {

    private final JdbcClient jdbcClient;

    public CustomerPageResponse<CustomerListItemResponse> findCustomers(
            String keyword,
            UserStatus statusFilter,
            int page,
            int size,
            String sortColumn,
            String sortDirection
    ) {
        StringBuilder where = new StringBuilder(" WHERE u.role = 'CUSTOMER' ");
        Map<String, Object> params = new HashMap<>();

        if (statusFilter != null) {
            where.append(" AND u.status = :status ");
            params.put("status", statusFilter.name());
        } else {
            where.append(" AND u.status IN ('ACTIVE', 'LOCKED') ");
        }

        if (keyword != null && !keyword.isBlank()) {
            String trimmed = keyword.trim();
            if (trimmed.matches("^\\d+$")) {
                Long exactId = null;
                try {
                    exactId = Long.parseLong(trimmed);
                } catch (NumberFormatException ignored) {
                }
                if (exactId != null) {
                    where.append(" AND (u.id = :exactId OR (u.phone IS NOT NULL AND u.phone LIKE :phoneLike ESCAPE '\\')) ");
                    params.put("exactId", exactId);
                } else {
                    where.append(" AND (u.phone IS NOT NULL AND u.phone LIKE :phoneLike ESCAPE '\\') ");
                }
                params.put("phoneLike", "%" + escapeLike(trimmed) + "%");
            } else {
                where.append(" AND (LOWER(COALESCE(u.name, '')) LIKE LOWER(:kwLike) ESCAPE '\\' OR LOWER(COALESCE(u.email, '')) LIKE LOWER(:kwLike) ESCAPE '\\') ");
                params.put("kwLike", "%" + escapeLike(trimmed) + "%");
            }
        }

        String countSql = "SELECT COUNT(*) FROM users u" + where;
        long totalElements = bindParams(jdbcClient.sql(countSql), params)
                .query(Long.class)
                .single();

        String orderBy = "fullName".equals(sortColumn)
                ? "u.name " + sortDirection + ", u.id DESC"
                : "u.created_at " + sortDirection + ", u.id DESC";

        String selectSql = """
                SELECT u.id, u.name AS full_name, u.email, u.avatar_url, u.status, u.created_at
                FROM users u
                """ + where + " ORDER BY " + orderBy + " LIMIT :limit OFFSET :offset";

        Map<String, Object> selectParams = new HashMap<>(params);
        selectParams.put("limit", size);
        selectParams.put("offset", (long) page * size);

        List<CustomerListItemResponse> items = bindParams(jdbcClient.sql(selectSql), selectParams)
                .query((rs, rowNum) -> new CustomerListItemResponse(
                        rs.getLong("id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("avatar_url"),
                        rs.getString("status"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
                ))
                .list();

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new CustomerPageResponse<>(items, page, size, totalElements, totalPages);
    }

    public CustomerSummaryResponse findSummary(LocalDateTime sevenDaysAgoThreshold) {
        String sql = """
                SELECT
                    COUNT(*) FILTER (WHERE status IN ('ACTIVE', 'LOCKED')) AS total,
                    COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active,
                    COUNT(*) FILTER (WHERE status = 'LOCKED') AS locked,
                    COUNT(*) FILTER (WHERE status IN ('ACTIVE', 'LOCKED') AND created_at >= :threshold) AS new_last_7_days
                FROM users
                WHERE role = 'CUSTOMER'
                """;
        return jdbcClient.sql(sql)
                .param("threshold", Timestamp.valueOf(sevenDaysAgoThreshold))
                .query((rs, rowNum) -> new CustomerSummaryResponse(
                        rs.getLong("total"),
                        rs.getLong("active"),
                        rs.getLong("locked"),
                        rs.getLong("new_last_7_days")
                ))
                .single();
    }

    private JdbcClient.StatementSpec bindParams(JdbcClient.StatementSpec spec, Map<String, Object> params) {
        JdbcClient.StatementSpec current = spec;
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            current = current.param(entry.getKey(), entry.getValue());
        }
        return current;
    }

    private static String escapeLike(String input) {
        return input
                .replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
