package com.vic.ecom.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorRegisterRequest {

    // Vendor fields
    @NotBlank(message = "Tên doanh nghiệp / tên kinh doanh không được để trống")
    private String businessName;

    private String kycDocumentUrl;

    // Shop fields
    @NotBlank(message = "Tên gian hàng không được để trống")
    private String shopName;

    private String logo;
    private String banner;
    private String description;

    @NotBlank(message = "Địa chỉ lấy hàng không được để trống")
    private String pickupAddress;

    private String phone;
    private String email;
}
