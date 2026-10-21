package com.vic.ecom;

import com.vic.ecom.enums.UserRole;
import com.vic.ecom.ultis.JwtUtil;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Comparator;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@TestPropertySource(properties = {
        "app.upload.avatar-dir=target/test-uploads/avatars"
})
class CustomerProfileIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private JwtUtil jwtUtil;

    private String customerToken;
    private String vendorToken;
    private String adminToken;

    @BeforeEach
    void setUp() {
        insertUser("Nguyễn Văn Khách", "it_customer1@vic.com", "0912345601", "CUSTOMER", "ACTIVE");
        insertUser("Khách Số Hai", "it_customer2@vic.com", "0987654302", "CUSTOMER", "ACTIVE");
        insertUser("Chủ Gian Hàng", "it_vendor1@vic.com", "0933444503", "VENDOR", "ACTIVE");
        insertUser("Quản Trị Viên", "it_admin1@vic.com", "0977888904", "ADMIN", "ACTIVE");

        customerToken = jwtUtil.generateToken("it_customer1@vic.com", UserRole.CUSTOMER.name());
        vendorToken = jwtUtil.generateToken("it_vendor1@vic.com", UserRole.VENDOR.name());
        adminToken = jwtUtil.generateToken("it_admin1@vic.com", UserRole.ADMIN.name());
    }

    @AfterEach
    void cleanUploads() throws Exception {
        Path uploadDir = Paths.get("target/test-uploads");
        if (Files.exists(uploadDir)) {
            try (var stream = Files.walk(uploadDir)) {
                stream.sorted(Comparator.reverseOrder()).forEach(p -> {
                    try {
                        Files.deleteIfExists(p);
                    } catch (Exception ignored) {
                    }
                });
            }
        }
    }

    @Test
    void shouldGetUpdateProfileEnforceRoleAndCheckDuplicatePhone() throws Exception {
        mockMvc.perform(get("/api/customer/profile"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/customer/profile")
                        .header("Authorization", "Bearer " + vendorToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/customer/profile")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Quản Trị Viên"))
                .andExpect(jsonPath("$.email").value("it_admin1@vic.com"))
                .andExpect(jsonPath("$.phone").value("0977888904"));

        mockMvc.perform(get("/api/customer/profile")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn Khách"))
                .andExpect(jsonPath("$.email").value("it_customer1@vic.com"))
                .andExpect(jsonPath("$.phone").value("0912345601"));

        // Duplicate phone with customer2 -> 409
        mockMvc.perform(put("/api/customer/profile")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyễn Văn Khách Mới\",\"phone\":\"+84 987 654 302\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PHONE_ALREADY_IN_USE"))
                .andExpect(jsonPath("$.field").value("phone"));

        // Invalid phone -> 400
        mockMvc.perform(put("/api/customer/profile")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyễn Văn Khách\",\"phone\":\"0123456\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.field").value("phone"));

        // Valid update with +84 normalization
        mockMvc.perform(put("/api/customer/profile")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyễn Văn A\",\"phone\":\"+84 919 888 777\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Nguyễn Văn A"))
                .andExpect(jsonPath("$.phone").value("0919888777"));
    }

    @Test
    void shouldValidateAvatarMagicBytesSizeAndCleanupOldFile() throws Exception {
        byte[] validPng = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x01, 0x02, 0x03
        };
        MockMultipartFile firstFile = new MockMultipartFile("file", "avatar.png", "image/png", validPng);

        String resp1 = mockMvc.perform(multipart("/api/customer/profile/avatar")
                        .file(firstFile)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", startsWith("/uploads/avatars/")))
                .andReturn().getResponse().getContentAsString();

        String firstFilename = resp1.replaceAll(".*\"/uploads/avatars/([^\"]+)\".*", "$1");
        Path firstDiskFile = Paths.get("target/test-uploads/avatars").resolve(firstFilename);
        assertThat(Files.exists(firstDiskFile)).isTrue();

        // Upload second valid JPEG -> old file must be deleted
        byte[] validJpg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        MockMultipartFile secondFile = new MockMultipartFile("file", "next.jpg", "image/jpeg", validJpg);

        mockMvc.perform(multipart("/api/customer/profile/avatar")
                        .file(secondFile)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", startsWith("/uploads/avatars/")));

        assertThat(Files.exists(firstDiskFile)).isFalse();

        // Fake .jpg with EXE magic bytes -> 422
        MockMultipartFile fakeJpg = new MockMultipartFile(
                "file", "hack.jpg", "image/jpeg", new byte[]{0x4D, 0x5A, 0x50, 0x00, 0x01});
        mockMvc.perform(multipart("/api/customer/profile/avatar")
                        .file(fakeJpg)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("UNSUPPORTED_AVATAR_FORMAT"));

        // Over 1MB -> 422
        byte[] oversized = new byte[1_048_577];
        oversized[0] = (byte) 0xFF;
        oversized[1] = (byte) 0xD8;
        oversized[2] = (byte) 0xFF;
        MockMultipartFile largeFile = new MockMultipartFile("file", "big.jpg", "image/jpeg", oversized);
        mockMvc.perform(multipart("/api/customer/profile/avatar")
                        .file(largeFile)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("AVATAR_TOO_LARGE"));
    }

    private void insertUser(String name, String email, String phone, String role, String status) {
        jdbcClient.sql("""
                INSERT INTO users (name, email, phone, password_hash, role, status, auth_provider, created_at)
                VALUES (:name, :email, :phone, 'hash', :role, :status, 'LOCAL', :now)
                """)
                .param("name", name)
                .param("email", email)
                .param("phone", phone)
                .param("role", role)
                .param("status", status)
                .param("now", Timestamp.valueOf(LocalDateTime.now()))
                .update();
    }
}
