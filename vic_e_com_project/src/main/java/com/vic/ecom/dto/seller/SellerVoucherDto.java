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
public class SellerVoucherDto {
    private Long id;
    private String code;
    private String title;
    private String discountText;
    private BigDecimal minOrderAmount;
    private Integer usedCount;
    private Integer totalQuota;
    private String expiryDate;
    private Boolean active;
}
