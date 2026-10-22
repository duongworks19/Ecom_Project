package com.vic.ecom.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorTerminateRequest {

    private String violationType;

    @NotBlank(message = "Lý do xóa tài khoản vi phạm không được để trống")
    @Size(min = 10, max = 500, message = "Lý do phải từ 10 đến 500 ký tự")
    private String reason;
}
