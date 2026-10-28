package com.vic.ecom.dto.vendor;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateShopRequest {
    private String name;
    private String phone;
    private String email;
    private String description;
    private String pickupAddress;
    private String businessHours;
}
