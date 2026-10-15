package com.vic.ecom;

import com.vic.ecom.entity.AccountLockLog;
import com.vic.ecom.enums.AccountAction;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.repository.AccountLockLogRepository;
import com.vic.ecom.services.AdminCustomerService;
import com.vic.ecom.ultis.JwtUtil;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.TimeZone;

import static com.vic.ecom.services.AdminCustomerService.VN_ZONE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.closeTo;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@TestPropertySource(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "ADMIN_EMAIL=admin@vic.com",
        "ADMIN_INITIAL_PASSWORD=SecretAdmin!2026"
})
class AdminCustomerIntegrationTest {

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
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminCustomerService adminCustomerService;

    @Autowired
    private AccountLockLogRepository accountLockLogRepository;

    private Long adminUserId;
    private String adminToken;
    private String customerToken;
    private String vendorToken;

    @BeforeAll
    static void forceUtcJvm() {
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
    }

    @BeforeEach
    void setUp() {
        jdbcClient.sql("""
                TRUNCATE TABLE
                    review_media,
                    review_replies,
                    product_reviews,
                    products,
                    shipments,
                    payments,
                    order_items,
                    orders,
                    vendors,
                    account_lock_logs,
                    addresses,
                    login_history,
                    password_reset_tokens,
                    users
                RESTART IDENTITY CASCADE
                """).update();

        ZonedDateTime fixedNow = ZonedDateTime.of(2026, 10, 15, 10, 0, 0, 0, VN_ZONE);
        adminCustomerService.setClock(Clock.fixed(fixedNow.toInstant(), VN_ZONE));

        adminUserId = insertUser("System Admin", "admin@vic.com", "0900000000", "ADMIN", "ACTIVE", "2026-01-01T08:00:00");
        adminToken = jwtUtil.generateToken("admin@vic.com", UserRole.ADMIN.name());
        customerToken = jwtUtil.generateToken("customer@vic.com", UserRole.CUSTOMER.name());
        vendorToken = jwtUtil.generateToken("vendor@vic.com", UserRole.VENDOR.name());
    }

    @Test
    void shouldEnforceAuthorizationReturning401And403() throws Exception {
        mockMvc.perform(get("/api/admin/customers"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/admin/customers")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldListOnlyActiveAndLockedCustomersAndExcludeOtherRolesAndPending() throws Exception {
        long c1 = insertUser("Nguyễn Minh Anh", "minhanh@gmail.com", "0901111218", "CUSTOMER", "ACTIVE", "2026-09-14T10:00:00");
        long c2 = insertUser("Đỗ Khánh Linh", "khanhlinh@gmail.com", "0902222333", "CUSTOMER", "LOCKED", "2026-09-02T10:00:00");
        long c3 = insertUser("Trần Quốc Bảo", "baotran@gmail.com", "0903333444", "CUSTOMER", "ACTIVE", "2026-09-03T10:00:00");
        insertUser("Pending User", "pending@gmail.com", "0904444555", "CUSTOMER", "PENDING", "2026-10-14T10:00:00");
        insertUser("Vendor User", "vendor@gmail.com", "0905555666", "VENDOR", "ACTIVE", "2026-10-14T10:00:00");
        insertUser("Shipper User", "shipper@gmail.com", "0906666777", "SHIPPER", "ACTIVE", "2026-10-14T10:00:00");

        mockMvc.perform(get("/api/admin/customers")
                        .param("page", "0")
                        .param("size", "2")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(2))
                .andExpect(jsonPath("$.totalElements").value(3))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.items[0].id").value(c1))
                .andExpect(jsonPath("$.items[0].fullName").value("Nguyễn Minh Anh"))
                .andExpect(jsonPath("$.items[1].id").value(c3))
                .andExpect(jsonPath("$.items[0].passwordHash").doesNotExist());

        mockMvc.perform(get("/api/admin/customers")
                        .param("page", "1")
                        .param("size", "2")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(c2))
                .andExpect(jsonPath("$.items[0].status").value("LOCKED"));
    }

    @Test
    void shouldSearchByIdNameEmailPhoneFilterByStatusAndHandleSqlInjectionAttemptSafely() throws Exception {
        long c1 = insertUser("Nguyen Minh Anh", "minhanh.nguyen@gmail.com", "0901999218", "CUSTOMER", "ACTIVE", "2026-09-14T10:00:00");
        long c2 = insertUser("Do Khanh Linh", "khanhlinh.do@gmail.com", "0988777666", "CUSTOMER", "LOCKED", "2026-09-02T10:00:00");

        // Search by exact numeric ID
        mockMvc.perform(get("/api/admin/customers")
                        .param("keyword", String.valueOf(c1))
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(c1));

        // Search by partial numeric phone
        mockMvc.perform(get("/api/admin/customers")
                        .param("keyword", "999218")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(c1));

        // Search by case-insensitive name
        mockMvc.perform(get("/api/admin/customers")
                        .param("keyword", "MINH ANH")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(c1));

        // Search by case-insensitive email
        mockMvc.perform(get("/api/admin/customers")
                        .param("keyword", "KHANHLINH.DO")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(c2));

        // Filter by status = LOCKED
        mockMvc.perform(get("/api/admin/customers")
                        .param("status", "LOCKED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].id").value(c2));

        // SQL injection string treated as normal literal keyword
        mockMvc.perform(get("/api/admin/customers")
                        .param("keyword", "' or 1=1--")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(jsonPath("$.items", hasSize(0)));

        // Invalid status or size>50 or invalid sort -> 400
        mockMvc.perform(get("/api/admin/customers")
                        .param("status", "PENDING")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/admin/customers")
                        .param("size", "51")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/admin/customers")
                        .param("sort", "passwordHash")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldCalculateSummaryCorrectlyIncluding7DayBoundaryInVietnamTime() throws Exception {
        // Fixed clock: 2026-10-15T10:00:00 Asia/Ho_Chi_Minh -> 7 days threshold is 2026-10-08T10:00:00
        insertUser("Boundary Inside", "in1@gmail.com", "0911000001", "CUSTOMER", "ACTIVE", "2026-10-08T10:00:00");
        insertUser("Recent Locked", "in2@gmail.com", "0911000002", "CUSTOMER", "LOCKED", "2026-10-14T23:30:00");
        insertUser("Boundary Outside", "out1@gmail.com", "0911000003", "CUSTOMER", "ACTIVE", "2026-10-08T09:59:59");
        insertUser("Pending Recent", "pending@gmail.com", "0911000004", "CUSTOMER", "PENDING", "2026-10-15T08:00:00");
        insertUser("Vendor Recent", "vendor@gmail.com", "0911000005", "VENDOR", "ACTIVE", "2026-10-15T08:00:00");

        mockMvc.perform(get("/api/admin/customers/summary")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(3))
                .andExpect(jsonPath("$.active").value(2))
                .andExpect(jsonPath("$.locked").value(1))
                .andExpect(jsonPath("$.newLast7Days").value(2));
    }

    @Test
    void shouldReturnCustomerDetailWithDefaultAddressFirstAndPurchaseSummaryAnd404ForNonCustomer() throws Exception {
        long customerWithOrders = insertUser("Nguyễn Minh Anh", "minhanh@gmail.com", "0901000218", "CUSTOMER", "ACTIVE", "2026-09-14T08:00:00");
        long customerNoOrders = insertUser("Lê Hoài Nam", "hoainam@gmail.com", "0902000111", "CUSTOMER", "ACTIVE", "2026-08-28T08:00:00");
        long vendorUserId = insertUser("Vendor Shop", "vendor1@gmail.com", "0903000111", "VENDOR", "ACTIVE", "2026-08-01T08:00:00");

        insertAddress(customerWithOrders, "Nguyễn Minh Anh (Phụ)", "0901000218", "Số 10, Đống Đa, Hà Nội", false);
        insertAddress(customerWithOrders, "Nguyễn Minh Anh", "0901000218", "Số 45, Cầu Giấy, Hà Nội", true);

        insertOrder(customerWithOrders, "ORD-001", "DELIVERED", new BigDecimal("5000000.00"), "2026-10-01T10:00:00");
        insertOrder(customerWithOrders, "ORD-002", "DELIVERED", new BigDecimal("2200000.00"), "2026-10-05T10:00:00");
        insertOrder(customerWithOrders, "ORD-003", "CANCELLED", new BigDecimal("1500000.00"), "2026-10-10T10:00:00");
        insertOrder(customerWithOrders, "ORD-004", "REJECTED", new BigDecimal("800000.00"), "2026-10-11T10:00:00");
        insertOrder(customerWithOrders, "ORD-005", "SHIPPING", new BigDecimal("900000.00"), "2026-10-12T15:30:00");

        mockMvc.perform(get("/api/admin/customers/{id}", customerWithOrders)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.id").value(customerWithOrders))
                .andExpect(jsonPath("$.profile.fullName").value("Nguyễn Minh Anh"))
                .andExpect(jsonPath("$.profile.email").value("minhanh@gmail.com"))
                .andExpect(jsonPath("$.profile.phone").value("0901000218"))
                .andExpect(jsonPath("$.profile.status").value("ACTIVE"))
                .andExpect(jsonPath("$.profile.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.addresses", hasSize(2)))
                .andExpect(jsonPath("$.addresses[0].isDefault").value(true))
                .andExpect(jsonPath("$.addresses[0].addressDetail").value("Số 45, Cầu Giấy, Hà Nội"))
                .andExpect(jsonPath("$.addresses[1].isDefault").value(false))
                .andExpect(jsonPath("$.purchaseSummary.totalOrders").value(5))
                .andExpect(jsonPath("$.purchaseSummary.cancelledOrders").value(2))
                .andExpect(jsonPath("$.purchaseSummary.totalSpent", closeTo(7200000.00, 0.01)))
                .andExpect(jsonPath("$.purchaseSummary.lastOrderAt").value("2026-10-12T15:30:00"));

        // Customer without orders -> 0 and null
        mockMvc.perform(get("/api/admin/customers/{id}", customerNoOrders)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.addresses", hasSize(0)))
                .andExpect(jsonPath("$.purchaseSummary.totalOrders").value(0))
                .andExpect(jsonPath("$.purchaseSummary.cancelledOrders").value(0))
                .andExpect(jsonPath("$.purchaseSummary.totalSpent", closeTo(0.0, 0.01)))
                .andExpect(jsonPath("$.purchaseSummary.lastOrderAt").value(nullValue()));

        // Vendor ID or non-existent ID -> 404
        mockMvc.perform(get("/api/admin/customers/{id}", vendorUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));

        mockMvc.perform(get("/api/admin/customers/{id}", 999999L)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    void shouldReturnCustomerOrdersAndReviewsWithLatestShipmentNullPaymentAndVendorReply() throws Exception {
        long customerId = insertUser("Nguyễn Minh Anh", "minhanh@gmail.com", "0901000218", "CUSTOMER", "ACTIVE", "2026-09-14T08:00:00");

        // Order 1 (older): no payment, no shipment
        long order1Id = insertOrder(customerId, "ORD-101", "PENDING", new BigDecimal("300000.00"), "2026-10-10T09:00:00");

        // Order 2 (newer): COD PAID payment, 2 shipments (FAILED earlier, DELIVERED latest)
        long order2Id = insertOrder(customerId, "ORD-102", "DELIVERED", new BigDecimal("750000.00"), "2026-10-12T14:00:00");
        insertPayment(order2Id, "COD", "PAID", new BigDecimal("750000.00"));
        insertShipment(order2Id, "FAILED", "2026-10-12T16:00:00");
        insertShipment(order2Id, "DELIVERED", "2026-10-13T11:00:00");

        mockMvc.perform(get("/api/admin/customers/{id}/orders", customerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items", hasSize(2)))
                // Newest first: ORD-102
                .andExpect(jsonPath("$.items[0].id").value(order2Id))
                .andExpect(jsonPath("$.items[0].orderCode").value("ORD-102"))
                .andExpect(jsonPath("$.items[0].status").value("DELIVERED"))
                .andExpect(jsonPath("$.items[0].paymentMethod").value("COD"))
                .andExpect(jsonPath("$.items[0].paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.items[0].shippingStatus").value("DELIVERED"))
                // Older: ORD-101 with null payment & shippingStatus
                .andExpect(jsonPath("$.items[1].id").value(order1Id))
                .andExpect(jsonPath("$.items[1].orderCode").value("ORD-101"))
                .andExpect(jsonPath("$.items[1].paymentMethod").value(nullValue()))
                .andExpect(jsonPath("$.items[1].paymentStatus").value(nullValue()))
                .andExpect(jsonPath("$.items[1].shippingStatus").value(nullValue()));

        // Reviews setup
        long prod1 = insertProduct("Tai nghe Bluetooth");
        long prod2 = insertProduct("Bàn phím cơ");
        long item1 = insertOrderItem(order1Id, "Tai nghe Bluetooth", 1, new BigDecimal("300000.00"));
        long item2 = insertOrderItem(order2Id, "Bàn phím cơ", 1, new BigDecimal("750000.00"));

        long rev1 = insertReview(prod1, item1, customerId, 4, "Tốt trong tầm giá", "2026-10-11T10:00:00");
        long rev2 = insertReview(prod2, item2, customerId, 5, "Rất hài lòng", "2026-10-14T10:00:00");
        insertReviewMedia(rev2, "https://cdn.vic.com/rev2-1.jpg", "IMAGE");
        insertReviewReply(rev2, adminUserId, "Cảm ơn quý khách đã ủng hộ!", "2026-10-14T12:00:00");

        mockMvc.perform(get("/api/admin/customers/{id}/reviews", customerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items", hasSize(2)))
                // Newest first: rev2 with media and vendorReply
                .andExpect(jsonPath("$.items[0].id").value(rev2))
                .andExpect(jsonPath("$.items[0].productId").value(prod2))
                .andExpect(jsonPath("$.items[0].productName").value("Bàn phím cơ"))
                .andExpect(jsonPath("$.items[0].orderCode").value("ORD-102"))
                .andExpect(jsonPath("$.items[0].rating").value(5))
                .andExpect(jsonPath("$.items[0].comment").value("Rất hài lòng"))
                .andExpect(jsonPath("$.items[0].media", hasSize(1)))
                .andExpect(jsonPath("$.items[0].media[0].url").value("https://cdn.vic.com/rev2-1.jpg"))
                .andExpect(jsonPath("$.items[0].media[0].type").value("IMAGE"))
                .andExpect(jsonPath("$.items[0].vendorReply.content").value("Cảm ơn quý khách đã ủng hộ!"))
                // Older: rev1 without media and without vendorReply
                .andExpect(jsonPath("$.items[1].id").value(rev1))
                .andExpect(jsonPath("$.items[1].orderCode").value("ORD-101"))
                .andExpect(jsonPath("$.items[1].media", hasSize(0)))
                .andExpect(jsonPath("$.items[1].vendorReply").value(nullValue()));
    }

    @Test
    void shouldLockAndUnlockCustomerRecordAuditLogRejectActiveTokenAndKeepOrdersIntact() throws Exception {
        long customerId = insertUserWithPassword("Customer Lock Test", "lockme@gmail.com", "0909123456", "CUSTOMER", "ACTIVE", "Secret123!", "2026-09-14T08:00:00");
        long vendorId = insertUser("Vendor User", "vendor_lock@gmail.com", "0909999888", "VENDOR", "ACTIVE", "2026-09-01T08:00:00");
        long orderId = insertOrder(customerId, "ORD-ACTIVE-1", "PREPARING", new BigDecimal("500000.00"), "2026-10-14T08:00:00");

        String activeCustomerJwt = jwtUtil.generateToken("lockme@gmail.com", UserRole.CUSTOMER.name());

        // Before lock: customer token is valid and authenticated (receives 200 on /api/vendors/me)
        mockMvc.perform(get("/api/vendors/me")
                        .header("Authorization", "Bearer " + activeCustomerJwt))
                .andExpect(status().isOk());

        // Lock customer (UC27)
        mockMvc.perform(post("/api/admin/customers/{id}/lock", customerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Gian lận hoàn hàng\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customerId))
                .andExpect(jsonPath("$.status").value("LOCKED"));

        // Repeat lock -> 409 Conflict, no duplicate log
        mockMvc.perform(post("/api/admin/customers/{id}/lock", customerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Lặp lại\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));

        // Verify active token is immediately rejected with 401
        mockMvc.perform(get("/api/vendors/me")
                        .header("Authorization", "Bearer " + activeCustomerJwt))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        // Verify login is rejected with 401
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\": \"lockme@gmail.com\", \"password\": \"Secret123!\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));

        // Verify in-progress order was NOT cancelled
        String orderStatus = jdbcClient.sql("SELECT status FROM orders WHERE id = :id")
                .param("id", orderId)
                .query(String.class)
                .single();
        assertThat(orderStatus).isEqualTo("PREPARING");

        // Unlock customer (UC28)
        mockMvc.perform(post("/api/admin/customers/{id}/unlock", customerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Đã xác minh nhầm lẫn\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(customerId))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        // Repeat unlock -> 409 Conflict
        mockMvc.perform(post("/api/admin/customers/{id}/unlock", customerId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false));

        // Verify audit logs in account_lock_logs
        List<AccountLockLog> logs = accountLockLogRepository.findByUserIdOrderByCreatedAtDesc(customerId);
        assertThat(logs).hasSize(2);
        assertThat(logs).extracting(AccountLockLog::getAction)
                .containsExactlyInAnyOrder(AccountAction.LOCK, AccountAction.UNLOCK);
        assertThat(logs).allSatisfy(l -> assertThat(l.getPerformedBy().getId()).isEqualTo(adminUserId));

        // Lock non-customer (Vendor) -> 404
        mockMvc.perform(post("/api/admin/customers/{id}/lock", vendorId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());

        // Reason > 500 chars -> 400
        String tooLongReason = "a".repeat(501);
        mockMvc.perform(post("/api/admin/customers/{id}/lock", customerId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"" + tooLongReason + "\"}"))
                .andExpect(status().isBadRequest());
    }

    private long insertUser(String fullName, String email, String phone, String role, String status, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO users (role, name, email, phone, auth_provider, status, created_at)
                VALUES (:role, :name, :email, :phone, 'LOCAL', :status, :createdAt)
                RETURNING id
                """)
                .param("role", role)
                .param("name", fullName)
                .param("email", email)
                .param("phone", phone)
                .param("status", status)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }

    private long insertUserWithPassword(String fullName, String email, String phone, String role, String status, String rawPassword, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO users (role, name, email, phone, password_hash, auth_provider, status, created_at)
                VALUES (:role, :name, :email, :phone, :passwordHash, 'LOCAL', :status, :createdAt)
                RETURNING id
                """)
                .param("role", role)
                .param("name", fullName)
                .param("email", email)
                .param("phone", phone)
                .param("passwordHash", passwordEncoder.encode(rawPassword))
                .param("status", status)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }

    private void insertAddress(long userId, String receiverName, String phone, String detail, boolean isDefault) {
        jdbcClient.sql("""
                INSERT INTO addresses (user_id, receiver_name, phone, address_detail, is_default)
                VALUES (:userId, :receiverName, :phone, :detail, :isDefault)
                """)
                .param("userId", userId)
                .param("receiverName", receiverName)
                .param("phone", phone)
                .param("detail", detail)
                .param("isDefault", isDefault)
                .update();
    }

    private long insertOrder(long customerId, String orderCode, String status, BigDecimal totalAmount, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO orders (order_code, customer_id, shop_id, status, total_amount, created_at)
                VALUES (:orderCode, :customerId, 1, :status, :totalAmount, :createdAt)
                RETURNING id
                """)
                .param("orderCode", orderCode)
                .param("customerId", customerId)
                .param("status", status)
                .param("totalAmount", totalAmount)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }

    private void insertPayment(long orderId, String method, String status, BigDecimal amount) {
        jdbcClient.sql("""
                INSERT INTO payments (order_id, method, status, amount)
                VALUES (:orderId, :method, :status, :amount)
                """)
                .param("orderId", orderId)
                .param("method", method)
                .param("status", status)
                .param("amount", amount)
                .update();
    }

    private void insertShipment(long orderId, String status, String assignedAt) {
        jdbcClient.sql("""
                INSERT INTO shipments (order_id, shipper_id, status, assigned_at)
                VALUES (:orderId, 100, :status, :assignedAt)
                """)
                .param("orderId", orderId)
                .param("status", status)
                .param("assignedAt", Timestamp.valueOf(LocalDateTime.parse(assignedAt)))
                .update();
    }

    private long insertProduct(String name) {
        return jdbcClient.sql("INSERT INTO products (name) VALUES (:name) RETURNING id")
                .param("name", name)
                .query(Long.class)
                .single();
    }

    private long insertOrderItem(long orderId, String productName, int quantity, BigDecimal unitPrice) {
        return jdbcClient.sql("""
                INSERT INTO order_items (order_id, variant_id, product_name, quantity, unit_price)
                VALUES (:orderId, 1, :productName, :quantity, :unitPrice)
                RETURNING id
                """)
                .param("orderId", orderId)
                .param("productName", productName)
                .param("quantity", quantity)
                .param("unitPrice", unitPrice)
                .query(Long.class)
                .single();
    }

    private long insertReview(long productId, long orderItemId, long customerId, int rating, String comment, String createdAt) {
        return jdbcClient.sql("""
                INSERT INTO product_reviews (product_id, order_item_id, customer_id, rating, comment, created_at)
                VALUES (:productId, :orderItemId, :customerId, :rating, :comment, :createdAt)
                RETURNING id
                """)
                .param("productId", productId)
                .param("orderItemId", orderItemId)
                .param("customerId", customerId)
                .param("rating", (short) rating)
                .param("comment", comment)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .query(Long.class)
                .single();
    }

    private void insertReviewMedia(long reviewId, String url, String type) {
        jdbcClient.sql("""
                INSERT INTO review_media (review_id, url, type)
                VALUES (:reviewId, :url, :type)
                """)
                .param("reviewId", reviewId)
                .param("url", url)
                .param("type", type)
                .update();
    }

    private void insertReviewReply(long reviewId, long userId, String content, String createdAt) {
        jdbcClient.sql("""
                INSERT INTO review_replies (review_id, user_id, content, created_at)
                VALUES (:reviewId, :userId, :content, :createdAt)
                """)
                .param("reviewId", reviewId)
                .param("userId", userId)
                .param("content", content)
                .param("createdAt", Timestamp.valueOf(LocalDateTime.parse(createdAt)))
                .update();
    }
}
