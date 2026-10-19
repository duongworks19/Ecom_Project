package com.vic.ecom;

import com.vic.ecom.enums.UserRole;
import com.vic.ecom.ultis.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CustomerOrderIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private JwtUtil jwtUtil;

    private Long customer1Id;
    private Long customer2Id;
    private String customer1Token;
    private String customer2Token;
    private Long variantId;

    @BeforeEach
    void setUp() {
        customer1Id = insertUser("Khách Đơn 1", "it_ord_o1@vic.com", "0912000191");
        customer2Id = insertUser("Khách Đơn 2", "it_ord_o2@vic.com", "0912000292");
        customer1Token = jwtUtil.generateToken("it_ord_o1@vic.com", UserRole.CUSTOMER.name());
        customer2Token = jwtUtil.generateToken("it_ord_o2@vic.com", UserRole.CUSTOMER.name());

        long productId = jdbcClient.sql("INSERT INTO products (name) VALUES ('Bàn phím cơ VIC') RETURNING id")
                .query(Long.class).single();
        variantId = jdbcClient.sql("""
                INSERT INTO product_variants (product_id, sku, price, stock_qty, low_stock_threshold)
                VALUES (:pid, 'SKU-KB-01', 500000.00, 10, 2) RETURNING id
                """).param("pid", productId).query(Long.class).single();
    }

    @Test
    void shouldListFilterCountAndCancelPendingOrderRestoringStockVoucherPaymentAndHistory() throws Exception {
        long pendingOrderId = insertOrder(customer1Id, "ORD-P1", "PENDING", "1000000.00");
        long shippingOrderId = insertOrder(customer1Id, "ORD-S1", "SHIPPING", "500000.00");
        insertOrder(customer1Id, "ORD-D1", "DELIVERED", "750000.00");

        insertOrderItem(pendingOrderId, variantId, "Bàn phím cơ VIC", 2, "500000.00");
        insertPayment(pendingOrderId, "PENDING", "1000000.00");
        insertVoucherUsage(pendingOrderId, customer1Id, 99L, "50000.00");

        // 1. List ALL with countsByStatus
        mockMvc.perform(get("/api/customer/orders")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content", hasSize(3)))
                .andExpect(jsonPath("$.countsByStatus.ALL").value(3))
                .andExpect(jsonPath("$.countsByStatus.PENDING").value(1))
                .andExpect(jsonPath("$.countsByStatus.SHIPPING").value(1))
                .andExpect(jsonPath("$.countsByStatus.COMPLETED").value(1));

        // 2. Cancel shippingOrderId -> 409 ORDER_NOT_CANCELLABLE
        mockMvc.perform(post("/api/customer/orders/{id}/cancel", shippingOrderId)
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Tôi muốn đổi địa chỉ nhận hàng\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ORDER_NOT_CANCELLABLE"));

        // 3. Customer 2 trying to cancel Customer 1's order -> 403
        mockMvc.perform(post("/api/customer/orders/{id}/cancel", pendingOrderId)
                        .header("Authorization", "Bearer " + customer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Cố tình hủy đơn người khác\"}"))
                .andExpect(status().isForbidden());

        // 4. Cancel pendingOrderId with valid reason -> 200 & side effects
        mockMvc.perform(post("/api/customer/orders/{id}/cancel", pendingOrderId)
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Đặt nhầm số lượng sản phẩm\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.canCancel").value(false));

        // Verify side effects in DB: order.cancel_reason, variant stock +2 (10 -> 12), inventory_logs CANCEL, payment FAILED, voucher_usages removed, order_status_history added
        String savedReason = jdbcClient.sql("SELECT cancel_reason FROM orders WHERE id = :id")
                .param("id", pendingOrderId).query(String.class).single();
        assertThat(savedReason).isEqualTo("Đặt nhầm số lượng sản phẩm");

        int newStock = jdbcClient.sql("SELECT stock_qty FROM product_variants WHERE id = :id")
                .param("id", variantId).query(Integer.class).single();
        assertThat(newStock).isEqualTo(12);

        String logReason = jdbcClient.sql("SELECT reason FROM inventory_logs WHERE order_id = :id")
                .param("id", pendingOrderId).query(String.class).single();
        assertThat(logReason).isEqualTo("CANCEL");

        String paymentStatus = jdbcClient.sql("SELECT status FROM payments WHERE order_id = :id")
                .param("id", pendingOrderId).query(String.class).single();
        assertThat(paymentStatus).isEqualTo("FAILED");

        long voucherCount = jdbcClient.sql("SELECT COUNT(*) FROM voucher_usages WHERE order_id = :id")
                .param("id", pendingOrderId).query(Long.class).single();
        assertThat(voucherCount).isZero();

        String historyToStatus = jdbcClient.sql("SELECT to_status FROM order_status_history WHERE order_id = :id")
                .param("id", pendingOrderId).query(String.class).single();
        assertThat(historyToStatus).isEqualTo("CANCELLED");
    }

    @Test
    void shouldRebuyOrderIntoCartCappingAtAvailableStock() throws Exception {
        long orderId = insertOrder(customer1Id, "ORD-RB1", "DELIVERED", "1500000.00");
        insertOrderItem(orderId, variantId, "Bàn phím cơ VIC", 3, "500000.00");

        mockMvc.perform(post("/api/customer/orders/{id}/rebuy", orderId)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.addedItemCount").value(3));

        int cartQty = jdbcClient.sql("""
                SELECT ci.quantity FROM cart_items ci
                JOIN carts c ON c.id = ci.cart_id
                WHERE c.user_id = :uid AND ci.variant_id = :vid
                """).param("uid", customer1Id).param("vid", variantId).query(Integer.class).single();
        assertThat(cartQty).isEqualTo(3);
    }

    private Long insertUser(String name, String email, String phone) {
        return jdbcClient.sql("""
                INSERT INTO users (name, email, phone, password_hash, role, status, auth_provider, created_at)
                VALUES (:name, :email, :phone, 'hash', 'CUSTOMER', 'ACTIVE', 'LOCAL', :now) RETURNING id
                """)
                .param("name", name).param("email", email).param("phone", phone)
                .param("now", Timestamp.valueOf(LocalDateTime.now()))
                .query(Long.class).single();
    }

    private Long insertOrder(Long customerId, String code, String status, String amount) {
        return jdbcClient.sql("""
                INSERT INTO orders (order_code, customer_id, status, total_amount, created_at)
                VALUES (:code, :cid, :status, :amount, :now) RETURNING id
                """)
                .param("code", code).param("cid", customerId).param("status", status)
                .param("amount", new BigDecimal(amount))
                .param("now", Timestamp.valueOf(LocalDateTime.now()))
                .query(Long.class).single();
    }

    private void insertOrderItem(Long orderId, Long varId, String name, int qty, String price) {
        jdbcClient.sql("""
                INSERT INTO order_items (order_id, variant_id, product_name, quantity, unit_price)
                VALUES (:oid, :vid, :name, :qty, :price)
                """)
                .param("oid", orderId).param("vid", varId).param("name", name)
                .param("qty", qty).param("price", new BigDecimal(price)).update();
    }

    private void insertPayment(Long orderId, String status, String amount) {
        jdbcClient.sql("INSERT INTO payments (order_id, method, status, amount) VALUES (:oid, 'COD', :st, :amt)")
                .param("oid", orderId).param("st", status).param("amt", new BigDecimal(amount)).update();
    }

    private void insertVoucherUsage(Long orderId, Long userId, Long voucherId, String discount) {
        jdbcClient.sql("""
                INSERT INTO voucher_usages (voucher_id, user_id, order_id, discount_amount, used_at)
                VALUES (:vid, :uid, :oid, :disc, :now)
                """)
                .param("vid", voucherId).param("uid", userId).param("oid", orderId)
                .param("disc", new BigDecimal(discount))
                .param("now", Timestamp.valueOf(LocalDateTime.now())).update();
    }
}
