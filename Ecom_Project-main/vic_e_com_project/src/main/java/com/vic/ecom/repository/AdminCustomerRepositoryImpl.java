package com.vic.ecom.repository;

import com.vic.ecom.dto.CustomerDetailResponse;
import com.vic.ecom.dto.CustomerListItemResponse;
import com.vic.ecom.dto.CustomerOrderItemResponse;
import com.vic.ecom.dto.CustomerPageResponse;
import com.vic.ecom.dto.CustomerReviewItemResponse;
import com.vic.ecom.dto.CustomerSummaryResponse;
import com.vic.ecom.enums.UserStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class AdminCustomerRepositoryImpl implements AdminCustomerRepository {

    private final JdbcClient jdbcClient;

    @Override
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

    @Override
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

    @Override
    public Optional<CustomerDetailResponse.Profile> findCustomerProfileById(Long customerId) {
        String sql = """
                SELECT u.id, u.name AS full_name, u.email, u.phone, u.avatar_url, u.status, u.created_at
                FROM users u
                WHERE u.id = :id
                  AND u.role = 'CUSTOMER'
                  AND u.status IN ('ACTIVE', 'LOCKED')
                """;
        return jdbcClient.sql(sql)
                .param("id", customerId)
                .query((rs, rowNum) -> new CustomerDetailResponse.Profile(
                        rs.getLong("id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("phone"),
                        rs.getString("avatar_url"),
                        rs.getString("status"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
                ))
                .optional();
    }

    @Override
    public List<CustomerDetailResponse.AddressItem> findAddressesByUserId(Long customerId) {
        String sql = """
                SELECT a.id, a.receiver_name, a.phone, a.address_detail, a.is_default
                FROM addresses a
                WHERE a.user_id = :userId
                ORDER BY a.is_default DESC, a.id ASC
                """;
        return jdbcClient.sql(sql)
                .param("userId", customerId)
                .query((rs, rowNum) -> new CustomerDetailResponse.AddressItem(
                        rs.getLong("id"),
                        rs.getString("receiver_name"),
                        rs.getString("phone"),
                        rs.getString("address_detail"),
                        rs.getBoolean("is_default")
                ))
                .list();
    }

    @Override
    public CustomerDetailResponse.PurchaseSummary findPurchaseSummary(Long customerId) {
        String sql = """
                SELECT
                    COUNT(*) AS total_orders,
                    COUNT(*) FILTER (WHERE o.status IN ('CANCELLED', 'REJECTED')) AS cancelled_orders,
                    COALESCE(SUM(o.total_amount) FILTER (WHERE o.status = 'DELIVERED'), 0.00) AS total_spent,
                    MAX(o.created_at) AS last_order_at
                FROM orders o
                WHERE o.customer_id = :customerId
                """;
        return jdbcClient.sql(sql)
                .param("customerId", customerId)
                .query((rs, rowNum) -> {
                    BigDecimal spent = rs.getBigDecimal("total_spent");
                    Timestamp lastTs = rs.getTimestamp("last_order_at");
                    return new CustomerDetailResponse.PurchaseSummary(
                            rs.getLong("total_orders"),
                            rs.getLong("cancelled_orders"),
                            spent != null ? spent : BigDecimal.ZERO,
                            lastTs != null ? lastTs.toLocalDateTime() : null
                    );
                })
                .single();
    }

    @Override
    public CustomerPageResponse<CustomerOrderItemResponse> findCustomerOrders(Long customerId, int page, int size) {
        long totalElements = jdbcClient.sql("SELECT COUNT(*) FROM orders o WHERE o.customer_id = :customerId")
                .param("customerId", customerId)
                .query(Long.class)
                .single();

        String sql = """
                SELECT
                    o.id,
                    o.order_code,
                    o.total_amount,
                    o.status,
                    p.method AS payment_method,
                    p.status AS payment_status,
                    s.status AS shipping_status,
                    o.created_at
                FROM orders o
                LEFT JOIN payments p ON p.order_id = o.id
                LEFT JOIN LATERAL (
                    SELECT sh.status
                    FROM shipments sh
                    WHERE sh.order_id = o.id
                    ORDER BY sh.assigned_at DESC NULLS LAST, sh.id DESC
                    LIMIT 1
                ) s ON TRUE
                WHERE o.customer_id = :customerId
                ORDER BY o.created_at DESC, o.id DESC
                LIMIT :limit OFFSET :offset
                """;

        List<CustomerOrderItemResponse> items = jdbcClient.sql(sql)
                .param("customerId", customerId)
                .param("limit", size)
                .param("offset", (long) page * size)
                .query((rs, rowNum) -> new CustomerOrderItemResponse(
                        rs.getLong("id"),
                        rs.getString("order_code"),
                        rs.getBigDecimal("total_amount"),
                        rs.getString("status"),
                        rs.getString("payment_method"),
                        rs.getString("payment_status"),
                        rs.getString("shipping_status"),
                        rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
                ))
                .list();

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new CustomerPageResponse<>(items, page, size, totalElements, totalPages);
    }

    @Override
    public CustomerPageResponse<CustomerReviewItemResponse> findCustomerReviews(Long customerId, int page, int size) {
        long totalElements = jdbcClient.sql("SELECT COUNT(*) FROM product_reviews r WHERE r.customer_id = :customerId")
                .param("customerId", customerId)
                .query(Long.class)
                .single();

        String sql = """
                SELECT
                    r.id,
                    r.product_id,
                    COALESCE(p.name, oi.product_name) AS product_name,
                    o.order_code,
                    r.rating,
                    r.comment,
                    rr.content AS reply_content,
                    rr.created_at AS reply_created_at,
                    r.created_at
                FROM product_reviews r
                LEFT JOIN products p ON p.id = r.product_id
                LEFT JOIN order_items oi ON oi.id = r.order_item_id
                LEFT JOIN orders o ON o.id = oi.order_id
                LEFT JOIN review_replies rr ON rr.review_id = r.id
                WHERE r.customer_id = :customerId
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT :limit OFFSET :offset
                """;

        record RawReviewRow(
                Long id,
                Long productId,
                String productName,
                String orderCode,
                Integer rating,
                String comment,
                CustomerReviewItemResponse.VendorReplyItem vendorReply,
                LocalDateTime createdAt
        ) {
        }

        List<RawReviewRow> rows = jdbcClient.sql(sql)
                .param("customerId", customerId)
                .param("limit", size)
                .param("offset", (long) page * size)
                .query((rs, rowNum) -> {
                    String replyContent = rs.getString("reply_content");
                    Timestamp replyTs = rs.getTimestamp("reply_created_at");
                    CustomerReviewItemResponse.VendorReplyItem reply = replyContent != null
                            ? new CustomerReviewItemResponse.VendorReplyItem(
                                    replyContent,
                                    replyTs != null ? replyTs.toLocalDateTime() : null
                            )
                            : null;
                    return new RawReviewRow(
                            rs.getLong("id"),
                            rs.getObject("product_id", Long.class),
                            rs.getString("product_name"),
                            rs.getString("order_code"),
                            rs.getObject("rating", Integer.class),
                            rs.getString("comment"),
                            reply,
                            rs.getTimestamp("created_at") != null ? rs.getTimestamp("created_at").toLocalDateTime() : null
                    );
                })
                .list();

        Map<Long, List<CustomerReviewItemResponse.MediaItem>> mediaByReviewId = new LinkedHashMap<>();
        if (!rows.isEmpty()) {
            List<Long> reviewIds = rows.stream().map(RawReviewRow::id).toList();
            String mediaSql = """
                    SELECT rm.review_id, rm.url, rm.type
                    FROM review_media rm
                    WHERE rm.review_id IN (:reviewIds)
                    ORDER BY rm.id ASC
                    """;
            jdbcClient.sql(mediaSql)
                    .param("reviewIds", reviewIds)
                    .query((rs, rowNum) -> {
                        long revId = rs.getLong("review_id");
                        mediaByReviewId.computeIfAbsent(revId, k -> new ArrayList<>())
                                .add(new CustomerReviewItemResponse.MediaItem(
                                        rs.getString("url"),
                                        rs.getString("type")
                                ));
                        return null;
                    })
                    .list();
        }

        List<CustomerReviewItemResponse> items = rows.stream()
                .map(r -> new CustomerReviewItemResponse(
                        r.id(),
                        r.productId(),
                        r.productName(),
                        r.orderCode(),
                        r.rating(),
                        r.comment(),
                        mediaByReviewId.getOrDefault(r.id(), List.of()),
                        r.vendorReply(),
                        r.createdAt()
                ))
                .toList();

        int totalPages = size == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        return new CustomerPageResponse<>(items, page, size, totalElements, totalPages);
    }

    @Override
    public int updateCustomerStatusConditionally(Long customerId, UserStatus expectedCurrentStatus, UserStatus newStatus) {
        String sql = """
                UPDATE users
                SET status = :newStatus
                WHERE id = :id
                  AND role = 'CUSTOMER'
                  AND status = :expectedStatus
                """;
        return jdbcClient.sql(sql)
                .param("newStatus", newStatus.name())
                .param("id", customerId)
                .param("expectedStatus", expectedCurrentStatus.name())
                .update();
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
