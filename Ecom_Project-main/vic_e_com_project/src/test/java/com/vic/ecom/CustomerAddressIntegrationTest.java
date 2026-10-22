package com.vic.ecom;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CustomerAddressIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcClient jdbcClient;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    private Long customer1Id;
    private String customer1Token;
    private String customer2Token;

    @BeforeEach
    void setUp() {
        customer1Id = insertUser("Khách Một", "it_addr_c1@vic.com", "0911222311");
        insertUser("Khách Hai", "it_addr_c2@vic.com", "0944555622");

        customer1Token = jwtUtil.generateToken("it_addr_c1@vic.com", UserRole.CUSTOMER.name());
        customer2Token = jwtUtil.generateToken("it_addr_c2@vic.com", UserRole.CUSTOMER.name());
    }

    @Test
    void shouldMaintainSingleDefaultStoreFormattedAddressDetailAndPreventDeletingDefault() throws Exception {
        // 1. First address with isDefault=false must still become default automatically
        String body1 = """
                {
                  "recipientName": "Nguyễn Minh Anh",
                  "phone": "0911222333",
                  "streetAddress": "Số 10, Ngõ 5 Hoàng Quốc Việt",
                  "ward": "Phường Nghĩa Đô",
                  "district": "Quận Cầu Giấy",
                  "province": "Hà Nội",
                  "isDefault": false
                }
                """;
        String res1 = mockMvc.perform(post("/api/customer/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body1))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault").value(true))
                .andExpect(jsonPath("$.streetAddress").value("Số 10, Ngõ 5 Hoàng Quốc Việt"))
                .andExpect(jsonPath("$.ward").value("Phường Nghĩa Đô"))
                .andExpect(jsonPath("$.district").value("Quận Cầu Giấy"))
                .andExpect(jsonPath("$.province").value("Hà Nội"))
                .andReturn().getResponse().getContentAsString();

        long addr1Id = objectMapper.readTree(res1).get("id").asLong();

        // Verify DB column address_detail follows "street, ward, district, province"
        String rawDetail = jdbcClient.sql("SELECT address_detail FROM addresses WHERE id = :id")
                .param("id", addr1Id)
                .query(String.class)
                .single();
        assertThat(rawDetail).isEqualTo("Số 10, Ngõ 5 Hoàng Quốc Việt, Phường Nghĩa Đô, Quận Cầu Giấy, Hà Nội");

        // 2. Second address with isDefault=true flips default from addr1 to addr2
        String body2 = """
                {
                  "recipientName": "Nguyễn Minh Anh (Văn phòng)",
                  "phone": "+84988777666",
                  "streetAddress": "Tòa Keangnam",
                  "ward": "Phường Mễ Trì",
                  "district": "Quận Nam Từ Liêm",
                  "province": "Hà Nội",
                  "isDefault": true
                }
                """;
        String res2 = mockMvc.perform(post("/api/customer/addresses")
                        .header("Authorization", "Bearer " + customer1Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault").value(true))
                .andExpect(jsonPath("$.phone").value("0988777666"))
                .andReturn().getResponse().getContentAsString();
        long addr2Id = objectMapper.readTree(res2).get("id").asLong();

        // List: default first (addr2), then addr1
        mockMvc.perform(get("/api/customer/addresses")
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].id").value(addr2Id))
                .andExpect(jsonPath("$[0].isDefault").value(true))
                .andExpect(jsonPath("$[1].id").value(addr1Id))
                .andExpect(jsonPath("$[1].isDefault").value(false));

        // 3. Deleting default address (addr2) -> 409 CANNOT_DELETE_DEFAULT_ADDRESS
        mockMvc.perform(delete("/api/customer/addresses/{id}", addr2Id)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CANNOT_DELETE_DEFAULT_ADDRESS"));

        // 4. Customer 2 trying to modify or delete Customer 1's address -> 403
        mockMvc.perform(patch("/api/customer/addresses/{id}/default", addr1Id)
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isForbidden());

        // 5. Switch default back to addr1, then delete addr2 -> 204
        mockMvc.perform(patch("/api/customer/addresses/{id}/default", addr1Id)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isDefault").value(true));

        long defaultCount = jdbcClient.sql(
                        "SELECT COUNT(*) FROM addresses WHERE user_id = :uid AND is_default = true")
                .param("uid", customer1Id)
                .query(Long.class)
                .single();
        assertThat(defaultCount).isEqualTo(1L);

        mockMvc.perform(delete("/api/customer/addresses/{id}", addr2Id)
                        .header("Authorization", "Bearer " + customer1Token))
                .andExpect(status().isNoContent());
    }

    private Long insertUser(String name, String email, String phone) {
        return jdbcClient.sql("""
                INSERT INTO users (name, email, phone, password_hash, role, status, auth_provider, created_at)
                VALUES (:name, :email, :phone, 'hash', 'CUSTOMER', 'ACTIVE', 'LOCAL', :now)
                RETURNING id
                """)
                .param("name", name)
                .param("email", email)
                .param("phone", phone)
                .param("now", Timestamp.valueOf(LocalDateTime.now()))
                .query(Long.class)
                .single();
    }
}
