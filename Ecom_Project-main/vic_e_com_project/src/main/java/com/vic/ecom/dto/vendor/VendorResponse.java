package com.vic.ecom.dto.vendor;

import com.vic.ecom.entity.Vendor;
import com.vic.ecom.enums.ApprovalStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VendorResponse {
    private Long id;
    private Long userId;
    private String businessName;
    private String kycDocumentUrl;
    private ApprovalStatus approvalStatus;
    private String rejectReason;
    private Long approvedBy;
    private ShopResponse shop;
    private String ownerName;
    private String email;
    private String phone;
    private String createdAt;

    public static VendorResponse fromEntity(Vendor vendor) {
        if (vendor == null) return null;
        VendorResponse res = new VendorResponse();
        res.setId(vendor.getId());
        if (vendor.getUser() != null) {
            res.setUserId(vendor.getUser().getId());
            res.setOwnerName(vendor.getUser().getFullName());
            res.setEmail(vendor.getUser().getEmail());
            res.setPhone(vendor.getUser().getPhone());
            if (vendor.getUser().getCreatedAt() != null) {
                res.setCreatedAt(vendor.getUser().getCreatedAt().toString());
            }
        }
        res.setBusinessName(vendor.getBusinessName());
        res.setKycDocumentUrl(vendor.getKycDocumentUrl());
        res.setApprovalStatus(vendor.getApprovalStatus());
        res.setRejectReason(vendor.getRejectReason());
        res.setApprovedBy(vendor.getApprovedBy() != null ? vendor.getApprovedBy().getId() : null);
        res.setShop(ShopResponse.fromEntity(vendor.getShop()));
        return res;
    }
}
