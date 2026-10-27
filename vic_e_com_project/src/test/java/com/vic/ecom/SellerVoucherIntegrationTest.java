package com.vic.ecom;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.User;
import com.vic.ecom.entity.Vendor;
import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.ApprovalStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.enums.VoucherDiscountType;
import com.vic.ecom.enums.VoucherStatus;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.repository.VendorRepository;
import com.vic.ecom.repository.VoucherRepository;
import com.vic.ecom.services.VoucherService;
import com.vic.ecom.ultis.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class SellerVoucherIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VendorRepository vendorRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private VoucherRepository voucherRepository;

    private User vendorUser1;
    private Shop shop1;
    private String vendor1Token;

    private User vendorUser2;
    private Shop shop2;
    private String vendor2Token;

    @BeforeEach
    void setUp() {
        // Setup Vendor 1 & Shop 1
        vendorUser1 = new User();
        vendorUser1.setFullName("Chủ Shop Một");
        vendorUser1.setEmail("vendor1_vouchers@vic.com");
        vendorUser1.setPhone("0981112233");
        vendorUser1.setRole(UserRole.VENDOR);
        vendorUser1.setStatus(UserStatus.ACTIVE);
        vendorUser1.setAuthProvider("LOCAL");
        vendorUser1 = userRepository.save(vendorUser1);

        Vendor vendor1 = new Vendor();
        vendor1.setUser(vendorUser1);
        vendor1.setBusinessName("Vendor One Ltd");
        vendor1.setApprovalStatus(ApprovalStatus.APPROVED);
        vendor1 = vendorRepository.save(vendor1);

        shop1 = new Shop();
        shop1.setVendor(vendor1);
        shop1.setName("Shop One Official");
        shop1 = shopRepository.save(shop1);

        vendor1Token = jwtUtil.generateToken(vendorUser1.getEmail(), UserRole.VENDOR.name());

        // Setup Vendor 2 & Shop 2
        vendorUser2 = new User();
        vendorUser2.setFullName("Chủ Shop Hai");
        vendorUser2.setEmail("vendor2_vouchers@vic.com");
        vendorUser2.setPhone("0982223344");
        vendorUser2.setRole(UserRole.VENDOR);
        vendorUser2.setStatus(UserStatus.ACTIVE);
        vendorUser2.setAuthProvider("LOCAL");
        vendorUser2 = userRepository.save(vendorUser2);

        Vendor vendor2 = new Vendor();
        vendor2.setUser(vendorUser2);
        vendor2.setBusinessName("Vendor Two Ltd");
        vendor2.setApprovalStatus(ApprovalStatus.APPROVED);
        vendor2 = vendorRepository.save(vendor2);

        shop2 = new Shop();
        shop2.setVendor(vendor2);
        shop2.setName("Shop Two Official");
        shop2 = shopRepository.save(shop2);

        vendor2Token = jwtUtil.generateToken(vendorUser2.getEmail(), UserRole.VENDOR.name());
    }

    @Test
    @DisplayName("Tạo voucher hợp lệ trả về 201 và chuẩn hóa mã chữ thường")
    void testCreateValidVoucher_NormalizesCode_Returns201() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String json = """
                {
                    "code": "  lumi20  ",
                    "discountType": "PERCENT",
                    "value": 20,
                    "maxDiscount": 50000,
                    "minOrderAmount": 100000,
                    "usageLimit": 100,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(7).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success", is(true)))
                .andExpect(jsonPath("$.data.code", is("LUMI20")))
                .andExpect(jsonPath("$.data.discountType", is("PERCENT")))
                .andExpect(jsonPath("$.data.usageLimit", is(100)))
                .andExpect(jsonPath("$.data.usedCount", is(0)))
                .andExpect(jsonPath("$.data.displayStatus", is("RUNNING")));
    }

    @Test
    @DisplayName("Tạo voucher với dữ liệu sai trả về 422")
    void testCreateVoucherValidationFailures_Returns422() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        // 1. value <= 0
        String reqValueZero = """
                {
                    "code": "BADVALUE",
                    "discountType": "FIXED",
                    "value": 0,
                    "usageLimit": 10,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(3).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqValueZero))
                .andExpect(status().isUnprocessableEntity());

        // 2. PERCENT value > 100
        String reqPercentTooHigh = """
                {
                    "code": "HIGHPERCENT",
                    "discountType": "PERCENT",
                    "value": 120,
                    "usageLimit": 10,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(3).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqPercentTooHigh))
                .andExpect(status().isUnprocessableEntity());

        // 3. maxDiscount với FIXED
        String reqMaxDiscountWithFixed = """
                {
                    "code": "FIXEDWITHMAX",
                    "discountType": "FIXED",
                    "value": 50000,
                    "maxDiscount": 30000,
                    "usageLimit": 10,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(3).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqMaxDiscountWithFixed))
                .andExpect(status().isUnprocessableEntity());

        // 4. endAt <= startAt
        String reqInvalidDateRange = """
                {
                    "code": "BADDATERANGE",
                    "discountType": "FIXED",
                    "value": 50000,
                    "usageLimit": 10,
                    "startAt": "%s",
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(5).toString(), now.plusDays(2).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqInvalidDateRange))
                .andExpect(status().isUnprocessableEntity());

        // 5. usageLimit = 0
        String reqUsageLimitZero = """
                {
                    "code": "ZEROLIMIT",
                    "discountType": "FIXED",
                    "value": 50000,
                    "usageLimit": 0,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(3).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqUsageLimitZero))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("Mã trùng trong cùng shop trả về 409, shop khác được phép, xóa mềm dùng lại được")
    void testCodeUniquenessAndReuseAfterSoftDelete() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String jsonCodeA = """
                {
                    "code": "VOUCHERABC",
                    "discountType": "FIXED",
                    "value": 30000,
                    "usageLimit": 50,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(5).toString());

        // Tạo lần 1 cho shop 1 -> 201
        MvcResult result = mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCodeA))
                .andExpect(status().isCreated())
                .andReturn();

        Long voucherId = objectMapper.readTree(result.getResponse().getContentAsString())
                .path("data").path("id").asLong();

        // Tạo lại với chữ thường trong cùng shop 1 -> 409
        String jsonCodeALower = """
                {
                    "code": "voucherabc",
                    "discountType": "FIXED",
                    "value": 30000,
                    "usageLimit": 50,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(5).toString());

        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCodeALower))
                .andExpect(status().isConflict());

        // Shop 2 dùng cùng mã VOUCHERABC -> được phép (201)
        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCodeA))
                .andExpect(status().isCreated());

        // Xóa voucher ở shop 1 (hard delete)
        mockMvc.perform(delete("/api/seller/vouchers/{id}", voucherId)
                        .header("Authorization", "Bearer " + vendor1Token))
                .andExpect(status().isOk());

        assertThat(voucherRepository.findById(voucherId)).isEmpty();

        // Sau khi xóa, shop 1 tạo lại cùng mã VOUCHERABC -> được phép (201)
        mockMvc.perform(post("/api/seller/vouchers")
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(jsonCodeA))
                .andExpect(status().isCreated());
    }

    @Test
    @DisplayName("Sửa voucher đã có usedCount > 0: đổi value -> 409, tăng usageLimit -> ok, giảm -> 409")
    void testUpdateVoucherWithUsedCountGreaterThanZero() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        Voucher voucher = Voucher.builder()
                .shop(shop1)
                .code("LOCKEDTEST")
                .discountType(VoucherDiscountType.PERCENT)
                .value(BigDecimal.valueOf(15))
                .maxDiscount(BigDecimal.valueOf(30000))
                .minOrderAmount(BigDecimal.valueOf(100000))
                .usageLimit(100)
                .usedCount(5) // Đã có 5 lượt dùng
                .startAt(now.minusDays(1))
                .endAt(now.plusDays(10))
                .status(VoucherStatus.ACTIVE)
                .createdAt(now.minusDays(1))
                .build();
        voucher = voucherRepository.save(voucher);

        // 1. Thử đổi value từ 15 thành 20 -> 409
        String reqChangeValue = """
                {
                    "code": "LOCKEDTEST",
                    "discountType": "PERCENT",
                    "value": 20,
                    "maxDiscount": 30000,
                    "minOrderAmount": 100000,
                    "usageLimit": 100,
                    "startAt": "%s",
                    "endAt": "%s"
                }
                """.formatted(voucher.getStartAt().toString(), voucher.getEndAt().toString());

        mockMvc.perform(put("/api/seller/vouchers/{id}", voucher.getId())
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqChangeValue))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field", is("value")));

        // 2. Thử giảm usageLimit từ 100 xuống 80 -> 409
        String reqReduceLimit = """
                {
                    "code": "LOCKEDTEST",
                    "discountType": "PERCENT",
                    "value": 15,
                    "maxDiscount": 30000,
                    "minOrderAmount": 100000,
                    "usageLimit": 80,
                    "startAt": "%s",
                    "endAt": "%s"
                }
                """.formatted(voucher.getStartAt().toString(), voucher.getEndAt().toString());

        mockMvc.perform(put("/api/seller/vouchers/{id}", voucher.getId())
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqReduceLimit))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.field", is("usageLimit")));

        // 3. Tăng usageLimit từ 100 lên 150 -> OK 200
        String reqIncreaseLimit = """
                {
                    "code": "LOCKEDTEST",
                    "discountType": "PERCENT",
                    "value": 15,
                    "maxDiscount": 30000,
                    "minOrderAmount": 100000,
                    "usageLimit": 150,
                    "startAt": "%s",
                    "endAt": "%s"
                }
                """.formatted(voucher.getStartAt().toString(), voucher.getEndAt().toString());

        mockMvc.perform(put("/api/seller/vouchers/{id}", voucher.getId())
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(reqIncreaseLimit))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.usageLimit", is(150)));
    }

    @Test
    @DisplayName("Voucher của shop khác trả về 404 ở GET, PUT, PATCH, DELETE (không lộ sự tồn tại)")
    void testCrossShopIsolation_Returns404() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        Voucher shop1Voucher = Voucher.builder()
                .shop(shop1)
                .code("SHOP1ONLY")
                .discountType(VoucherDiscountType.FIXED)
                .value(BigDecimal.valueOf(20000))
                .minOrderAmount(BigDecimal.ZERO)
                .usageLimit(50)
                .usedCount(0)
                .startAt(now.minusHours(1))
                .endAt(now.plusDays(5))
                .status(VoucherStatus.ACTIVE)
                .createdAt(now)
                .build();
        shop1Voucher = voucherRepository.save(shop1Voucher);
        Long id = shop1Voucher.getId();

        // Vendor 2 cố tình truy cập voucher của Shop 1:
        // 1. GET /{id} -> 404
        mockMvc.perform(get("/api/seller/vouchers/{id}", id)
                        .header("Authorization", "Bearer " + vendor2Token))
                .andExpect(status().isNotFound());

        // 2. PUT /{id} -> 404
        String updateJson = """
                {
                    "code": "HACKCODE",
                    "discountType": "FIXED",
                    "value": 20000,
                    "usageLimit": 50,
                    "endAt": "%s"
                }
                """.formatted(now.plusDays(5).toString());
        mockMvc.perform(put("/api/seller/vouchers/{id}", id)
                        .header("Authorization", "Bearer " + vendor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateJson))
                .andExpect(status().isNotFound());

        // 3. PATCH /{id}/status -> 404
        String statusJson = """
                {
                    "status": "PAUSED"
                }
                """;
        mockMvc.perform(patch("/api/seller/vouchers/{id}/status", id)
                        .header("Authorization", "Bearer " + vendor2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusJson))
                .andExpect(status().isNotFound());

        // 4. DELETE /{id} -> 404
        mockMvc.perform(delete("/api/seller/vouchers/{id}", id)
                        .header("Authorization", "Bearer " + vendor2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("displayStatus tính đúng cho cả 5 trường hợp")
    void testDisplayStatusFor5Cases() {
        LocalDateTime now = LocalDateTime.of(2026, 10, 27, 12, 0, 0);

        // 1. PAUSED
        Voucher pausedVoucher = Voucher.builder()
                .status(VoucherStatus.PAUSED)
                .startAt(now.minusDays(1))
                .endAt(now.plusDays(5))
                .usageLimit(100)
                .usedCount(10)
                .build();
        assertThat(VoucherService.computeDisplayStatus(pausedVoucher, now)).isEqualTo("PAUSED");

        // 2. UPCOMING (now < startAt)
        Voucher upcomingVoucher = Voucher.builder()
                .status(VoucherStatus.ACTIVE)
                .startAt(now.plusDays(1))
                .endAt(now.plusDays(5))
                .usageLimit(100)
                .usedCount(0)
                .build();
        assertThat(VoucherService.computeDisplayStatus(upcomingVoucher, now)).isEqualTo("UPCOMING");

        // 3. EXPIRED (now > endAt)
        Voucher expiredVoucher = Voucher.builder()
                .status(VoucherStatus.ACTIVE)
                .startAt(now.minusDays(10))
                .endAt(now.minusDays(1))
                .usageLimit(100)
                .usedCount(20)
                .build();
        assertThat(VoucherService.computeDisplayStatus(expiredVoucher, now)).isEqualTo("EXPIRED");

        // 4. EXHAUSTED (usedCount >= usageLimit)
        Voucher exhaustedVoucher = Voucher.builder()
                .status(VoucherStatus.ACTIVE)
                .startAt(now.minusDays(1))
                .endAt(now.plusDays(5))
                .usageLimit(50)
                .usedCount(50)
                .build();
        assertThat(VoucherService.computeDisplayStatus(exhaustedVoucher, now)).isEqualTo("EXHAUSTED");

        // 5. RUNNING (đang hoạt động bình thường)
        Voucher runningVoucher = Voucher.builder()
                .status(VoucherStatus.ACTIVE)
                .startAt(now.minusDays(1))
                .endAt(now.plusDays(5))
                .usageLimit(50)
                .usedCount(10)
                .build();
        assertThat(VoucherService.computeDisplayStatus(runningVoucher, now)).isEqualTo("RUNNING");
    }

    @Test
    @DisplayName("Đổi trạng thái voucher đã quá hạn endAt trả về 409")
    void testToggleExpiredVoucher_Returns409() throws Exception {
        LocalDateTime now = LocalDateTime.now();

        Voucher expired = Voucher.builder()
                .shop(shop1)
                .code("EXPIREDTOGGLE")
                .discountType(VoucherDiscountType.FIXED)
                .value(BigDecimal.valueOf(10000))
                .minOrderAmount(BigDecimal.ZERO)
                .usageLimit(50)
                .usedCount(0)
                .startAt(now.minusDays(10))
                .endAt(now.minusDays(1))
                .status(VoucherStatus.ACTIVE)
                .createdAt(now.minusDays(10))
                .build();
        expired = voucherRepository.save(expired);

        String statusJson = """
                {
                    "status": "PAUSED"
                }
                """;

        mockMvc.perform(patch("/api/seller/vouchers/{id}/status", expired.getId())
                        .header("Authorization", "Bearer " + vendor1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(statusJson))
                .andExpect(status().isConflict());
    }
}
