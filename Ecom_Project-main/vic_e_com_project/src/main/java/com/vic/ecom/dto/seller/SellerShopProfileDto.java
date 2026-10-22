package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerShopProfileDto {
    private String shopName;
    private String tagline;
    private String description;
    private String phone;
    private String email;
    private String pickupAddress;
    private String businessHours;
}
