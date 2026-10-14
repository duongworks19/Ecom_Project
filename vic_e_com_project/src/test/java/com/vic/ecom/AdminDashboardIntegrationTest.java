package com.vic.ecom;

import com.vic.ecom.config.AdminBootstrap;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.AdminDashboardService;
import com.vic.ecom.ultis.JwtUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.TimeZone;

import static com.vic.ecom.services.AdminDashboardService.VN_ZONE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestPropertySource(properties = {
        "ADMIN_EMAIL=admin@vic.com",
        "ADMIN_INITIAL_PASSWORD=SecretAdmin!2026"
})
class AdminDashboardIntegrationTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:18-alpine");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AdminDashboardService adminDashboardService;

    @Autowired
    private AdminBootstrap adminBootstrap;

    @Autowired
    private UserRepository userRepository;

    private String adminToken;
    private String customerToken;

    @BeforeAll
    static void forceUtcJvm() {
        // Simulate server running in UTC to verify timezone consistency with Asia/Ho_Chi_Minh
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    @BeforeEach
    void setUp() {
        jdbcClient.sql("""
                TRUNCATE TABLE
                    delivery_failures,
                    shipments,
                    order_status_history,
                    return_requests,
                    orders,
                    vendors,
                    account_lock_logs,
                    addresses,
                    login_history,
                    password_reset_tokens,
                    users
                RESTART IDENTITY CASCADE
                """).update();

        ZonedDateTime fixedNow = ZonedDateTime.of(2026, 10, 14, 10, 0, 0, 0, VN_ZONE);
        adminDashboardService.setClock(Clock.fixed(fixedNow.toInstant(), VN_ZONE));

        adminToken = jwtUtil.generateToken("admin@vic.com", UserRole.ADMIN.name());
        customerToken = jwtUtil.generateToken("customer@vic.com", UserRole.CUSTOMER.name());
    }

    @Test
    void shouldReturn401WhenUnauthenticatedAnd403WhenCustomer() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldReturnAllZerosAnd7EmptyDaysAndEmptyActivitiesWhenDatabaseIsEmpty() throws Exception {
        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingTasks.pendingVendors").value(0))
                .andExpect(jsonPath("$.pendingTasks.ordersAwaitingShipper").value(0))
                .andExpect(jsonPath("$.pendingTasks.failedDeliveriesAwaitingDecision").value(0))
                .andExpect(jsonPath("$.pendingTasks.pendingReturns").value(0))
                .andExpect(jsonPath("$.orderStatus.total").value(0))
                .andExpect(jsonPath("$.orderStatus.pending").value(0))
                .andExpect(jsonPath("$.orderStatus.preparing").value(0))
                .andExpect(jsonPath("$.orderStatus.shipping").value(0))
                .andExpect(jsonPath("$.orderStatus.delivered").value(0))
                .andExpect(jsonPath("$.orderStatus.cancelled").value(0))
                .andExpect(jsonPath("$.revenueLast7Days", hasSize(7)))
                .andExpect(jsonPath("$.revenueLast7Days[0].date").value("2026-10-08"))
                .andExpect(jsonPath("$.revenueLast7Days[0].amount", closeTo(0.0, 0.001)))
                .andExpect(jsonPath("$.revenueLast7Days[6].date").value("2026-10-14"))
                .andExpect(jsonPath("$.revenueLast7Days[6].amount", closeTo(0.0, 0.001)))
                .andExpect(jsonPath("$.recentActivities", hasSize(0)));
    }

    @Test
    void shouldGroupOrderStatusAndExcludePackedOrdersWithActiveShipments() throws Exception {
        insertOrder("ORD-01", "PENDING", 100000, "2026-10-14T08:00:00", null);
        insertOrder("ORD-02", "CONFIRMED", 100000, "2026-10-14T08:00:00", null);
        insertOrder("ORD-03", "PREPARING", 100000, "2026-10-14T08:00:00", null);
        long packedWaitingId = insertOrder("ORD-04", "PACKED", 100000, "2026-10-14T08:00:00", null);
        long packedAssignedId = insertOrder("ORD-05", "PACKED", 100000, "2026-10-14T08:00:00", null);
        long packedFailedShipmentId = insertOrder("ORD-06", "PACKED", 100000, "2026-10-14T08:00:00", null);
        insertOrder("ORD-07", "SHIPPING", 100000, "2026-10-14T08:00:00", null);
        insertOrder("ORD-08", "DELIVERED", 250000, "2026-10-10T08:00:00", "2026-10-12T15:00:00");
        insertOrder("ORD-09", "CANCELLED", 100000, "2026-10-14T08:00:00", null);
        insertOrder("ORD-10", "REJECTED", 100000, "2026-10-14T08:00:00", null);

        // ORD-05 has an active ASSIGNED shipment -> must NOT count in ordersAwaitingShipper
        insertShipment(packedAssignedId, "ASSIGNED");
        // ORD-06 only has a FAILED shipment (not active) -> MUST count in ordersAwaitingShipper along with ORD-04
        insertShipment(packedFailedShipmentId, "FAILED");

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingTasks.ordersAwaitingShipper").value(2))
                .andExpect(jsonPath("$.orderStatus.total").value(10))
                .andExpect(jsonPath("$.orderStatus.pending").value(1))
                .andExpect(jsonPath("$.orderStatus.preparing").value(5)) // CONFIRMED(1) + PREPARING(1) + PACKED(3)
                .andExpect(jsonPath("$.orderStatus.shipping").value(1))
                .andExpect(jsonPath("$.orderStatus.delivered").value(1))
                .andExpect(jsonPath("$.orderStatus.cancelled").value(2)); // CANCELLED(1) + REJECTED(1)
    }

    @Test
    void shouldBucketDeliveredOrderAt2330VietnamTimeIntoSameDayEvenWhenJvmRunsInUtc() throws Exception {
        // 2026-10-13 23:30:00 Asia/Ho_Chi_Minh (which is 16:30 UTC, or if shifted wrongly +7h would become 2026-10-14)
        insertOrder("ORD-VN-2330", "DELIVERED", 12400000, "2026-10-13T10:00:00", "2026-10-13T23:30:00");
        insertOrder("ORD-VN-0015", "DELIVERED", 5000000, "2026-10-13T20:00:00", "2026-10-14T00:15:00");

        mockMvc.perform(get("/api/admin/dashboard")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.revenueLast7Days", hasSize(7)))
                // Index 5 is 2026-10-13
                .andExpect(jsonPath("$.revenueLast7Days[5].date").value("2026-10-13"))
                .andExpect(jsonPath("$.revenueLast7Days[5].amount", closeTo(12400000.0, 0.01)))
                // Index 6 is 2026-10-14
                .andExpect(jsonPath("$.revenueLast7Days[6].date").value("2026-10-14"))
                .andExpect(jsonPath("$.revenueLast7Days[6].amount", closeTo(5000000.0, 0.01)));
    }

    @Test
    void shouldSortAndLimitRecentActivitiesCorrectlyAcrossAll4Sources() throws Exception {
        long userId = insertUser("vendor1@vic.com", "VENDOR", "2026-10-13T08:00:00");
        long vendorId = insertVendor(userId, "PENDING");

        long orderId = insertOrder("ORD-999", "PACKED", 350000, "2026-10-13T07:00:00", null);
        insertOrderHistory(orderId, "PREPARING", "PACKED", "2026-10-13T08:30:00");
        insertOrderHistory(orderId, "PACKED", "PACKED", "2026-10-13T09:00:00"); // latest PACKED timestamp

        long otherOrderId = insertOrder("ORD-888", "SHIPPING", 200000, "2026-10-13T07:00:00", null);
        long shipmentId = insertShipment(otherOrderId, "FAILED");
        long failureId = insertDeliveryFailure(shipmentId, null, "2026-10-13T10:00:00");
        insertDeliveryFailure(shipmentId, "RETRY", "2026-10-13T11:00:00"); // resolved -> excluded

        long returnId = insertReturnRequest("PENDING", "2026-10-13T10:30:00");
        insertReturnRequest("APPROVED", "2026-10-13T11:30:00"); // non-pending -> excluded

        // Total valid activities = 4:
        // 1. RETURN (10:30)
        // 2. SHIPPING (10:00)
        // 3. ORDER ORD-999 (09:00)
        // 4. VENDOR (08:00)
        mockMvc.perform(get("/api/admin/dashboard")
                        .param("limit", "3")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pendingTasks.pendingVendors").value(1))
                .andExpect(jsonPath("$.pendingTasks.ordersAwaitingShipper").value(1))
                .andExpect(jsonPath("$.pendingTasks.failedDeliveriesAwaitingDecision").value(1))
                .andExpect(jsonPath("$.pendingTasks.pendingReturns").value(1))
                .andExpect(jsonPath("$.recentActivities", hasSize(3)))
                .andExpect(jsonPath("$.recentActivities[0].type").value("RETURN"))
                .andExpect(jsonPath("$.recentActivities[0].title").value("Khách gửi yêu cầu đổi trả sản phẩm"))
                .andExpect(jsonPath("$.recentActivities[0].referenceId").value(returnId))
                .andExpect(jsonPath("$.recentActivities[0].occurredAt").value("2026-10-13T10:30:00"))
                .andExpect(jsonPath("$.recentActivities[1].type").value("SHIPPING"))
                .andExpect(jsonPath("$.recentActivities[1].title").value("Shipper báo giao thất bại, chờ quyết định"))
                .andExpect(jsonPath("$.recentActivities[1].referenceId").value(failureId))
                .andExpect(jsonPath("$.recentActivities[1].occurredAt").value("2026-10-13T10:00:00"))
                .andExpect(jsonPath("$.recentActivities[2].type").value("ORDER"))
                .andExpect(jsonPath("$.recentActivities[2].title").value("Đơn ORD-999 đã đóng gói, chờ gán shipper"))
                .andExpect(jsonPath("$.recentActivities[2].referenceId").value(orderId))
                .andExpect(jsonPath("$.recentActivities[2].occurredAt").value("2026-10-13T09:00:00"));
    }

    @Test
    void shouldBootstrapAdminIdempotently() {
        assertThat(userRepository.existsByRole(UserRole.ADMIN)).isFalse();
        adminBootstrap.run(new DefaultApplicationArguments());
        assertThat(userRepository.existsByRole(UserRole.ADMIN)).isTrue();
        adminBootstrap.run(new DefaultApplicationArguments());
        assertThat(userRepository.count()).isEqualTo(1);
    }

    private long insertUser(String email, String role, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO users (role, full_name, email, auth_provider, status, created_at)
                VALUES (:role, 'Test User', :email, 'LOCAL', 'ACTIVE', :createdAt)
                RETURNING id
                """)
                .param("role", role)
                .param("email", email)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }

    private long insertVendor(long userId, String approvalStatus) {
        return jdbcClient.sql("""
                INSERT INTO vendors (user_id, approval_status)
                VALUES (:userId, :status)
                RETURNING id
                """)
                .param("userId", userId)
                .param("status", approvalStatus)
                .query(Long.class)
                .single();
    }

    private long insertOrder(String code, String status, double amount, String createdAt, String deliveredAt) {
        return jdbcClient.sql("""
                INSERT INTO orders (order_code, status, total_amount, created_at, delivered_at)
                VALUES (:code, :status, :amount, :createdAt, :deliveredAt)
                RETURNING id
                """)
                .param("code", code)
                .param("status", status)
                .param("amount", amount)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .param("deliveredAt", deliveredAt != null ? Timestamp.valueOf(LocalDateTime.parse(deliveredAt)) : null)
                .query(Long.class)
                .single();
    }

    private void insertOrderHistory(long orderId, String fromStatus, String toStatus, String changedAt) {
        jdbcClient.sql("""
                INSERT INTO order_status_history (order_id, from_status, to_status, changed_at)
                VALUES (:orderId, :fromStatus, :toStatus, :changedAt)
                """)
                .param("orderId", orderId)
                .param("fromStatus", fromStatus)
                .param("toStatus", toStatus)
                .param("changedAt", Timestamp.valueOf(LocalDateTime.parse(changedAt)))
                .update();
    }

    private long insertShipment(long orderId, String status) {
        return jdbcClient.sql("""
                INSERT INTO shipments (order_id, status, assigned_at)
                VALUES (:orderId, :status, CURRENT_TIMESTAMP)
                RETURNING id
                """)
                .param("orderId", orderId)
                .param("status", status)
                .query(Long.class)
                .single();
    }

    private long insertDeliveryFailure(long shipmentId, String nextAction, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO delivery_failures (shipment_id, reason, attempt_no, next_action, created_at)
                VALUES (:shipmentId, 'Khách không nghe máy', 1, :nextAction, :createdAt)
                RETURNING id
                """)
                .param("shipmentId", shipmentId)
                .param("nextAction", nextAction)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }

    private long insertReturnRequest(String status, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO return_requests (status, created_at)
                VALUES (:status, :createdAt)
                RETURNING id
                """)
                .param("status", status)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }
}
