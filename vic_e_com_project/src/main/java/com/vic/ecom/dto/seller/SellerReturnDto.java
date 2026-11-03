package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerReturnDto {
    private Long id;
    private String orderCode;
    private String customerName;
    private String type; // Trả hàng & Hoàn tiền / Đổi hàng
    private String reason;
    private BigDecimal amount;
    private Integer imageCount;
    private String status; // PENDING, APPROVED, REJECTED
    private String vendorResponse;
    private String createdAt;
}
