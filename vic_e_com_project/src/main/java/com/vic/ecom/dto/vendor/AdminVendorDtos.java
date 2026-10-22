package com.vic.ecom.dto.vendor;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

public final class AdminVendorDtos {
    private AdminVendorDtos() { }

    @Getter
    @Builder
    public static class AdminVendorListItemDto {
        private Long id;
        private Long userId;
        private String ownerName;
        private String ownerEmail;
        private String ownerPhone;
        private String businessName;
        private String shopName;
        private String shopLogo;
        private String shopPickupAddress;
        private String kycDocumentUrl;
        private String approvalStatus;
        private String rejectReason;
        private String createdAt;
    }

    @Getter
    @Builder
    public static class AdminVendorPageResponseDto {
        private List<AdminVendorListItemDto> items;
        private long total;
        private int page;
        private int size;
    }

    @Getter
    @Builder
    public static class AdminVendorSummaryDto {
        private long total;
        private long pending;
        private long approved;
        private long rejected;
    }
}
