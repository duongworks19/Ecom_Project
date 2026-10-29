package com.vic.ecom.dto.vendor;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorApprovalRequest {
    @NotBlank(message = "Hành động duyệt (APPROVE/REJECT/NEED_INFO) là bắt buộc")
    private String action;

    private String rejectReason;
}
