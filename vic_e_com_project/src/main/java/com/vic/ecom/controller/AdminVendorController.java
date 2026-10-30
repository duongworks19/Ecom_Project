package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.vendor.AdminVendorDtos.*;
import com.vic.ecom.dto.vendor.VendorApprovalRequest;
import com.vic.ecom.dto.vendor.VendorResponse;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.User;
import com.vic.ecom.entity.Vendor;
import com.vic.ecom.enums.ApprovalStatus;
import com.vic.ecom.repository.VendorRepository;
import com.vic.ecom.services.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/vendors")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminVendorController {

    private final VendorRepository vendorRepository;
    private final VendorService vendorService;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @GetMapping
    public ResponseEntity<AdminVendorPageResponseDto> getVendors(
            @RequestParam(name = "status", required = false) String statusParam,
            @RequestParam(name = "keyword", required = false) String keywordParam,
            @RequestParam(name = "page", defaultValue = "0") Integer page,
            @RequestParam(name = "size", defaultValue = "10") Integer size
    ) {
        PageRequest pageable = PageRequest.of(Math.max(0, page), Math.max(1, size));

        ApprovalStatus status = null;
        if (statusParam != null && !statusParam.isBlank() && !"ALL".equalsIgnoreCase(statusParam) && !"TODO".equalsIgnoreCase(statusParam)) {
            try {
                if ("NEED_INFO".equalsIgnoreCase(statusParam.trim()) || "REVISION_NEEDED".equalsIgnoreCase(statusParam.trim())) {
                    status = ApprovalStatus.REVISION_NEEDED;
                } else {
                    status = ApprovalStatus.valueOf(statusParam.trim().toUpperCase());
                }
            } catch (Exception ignored) {
            }
        }

        String keyword = (keywordParam != null && !keywordParam.isBlank()) ? keywordParam.trim() : null;

        Page<Vendor> result;
        if (status != null && keyword != null) {
            result = vendorRepository.findByApprovalStatusAndBusinessNameContainingIgnoreCaseOrderByIdDesc(status, keyword, pageable);
        } else if (status != null) {
            result = vendorRepository.findByApprovalStatusOrderByIdDesc(status, pageable);
        } else if (keyword != null) {
            result = vendorRepository.findByBusinessNameContainingIgnoreCaseOrderByIdDesc(keyword, pageable);
        } else {
            result = vendorRepository.findAllByOrderByIdDesc(pageable);
        }

        List<AdminVendorListItemDto> items = result.getContent().stream()
                .map(this::toItemDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(AdminVendorPageResponseDto.builder()
                .items(items)
                .total(result.getTotalElements())
                .page(result.getNumber())
                .size(result.getSize())
                .build());
    }

    @GetMapping("/summary")
    public ResponseEntity<AdminVendorSummaryDto> getSummary() {
        long total = vendorRepository.count();
        long pending = vendorRepository.countByApprovalStatus(ApprovalStatus.PENDING);
        long approved = vendorRepository.countByApprovalStatus(ApprovalStatus.APPROVED);
        long rejected = vendorRepository.countByApprovalStatus(ApprovalStatus.REJECTED);

        return ResponseEntity.ok(AdminVendorSummaryDto.builder()
                .total(total)
                .pending(pending)
                .approved(approved)
                .rejected(rejected)
                .build());
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<VendorResponse>> reviewVendor(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody VendorApprovalRequest req
    ) {
        String adminPrincipal = auth != null ? auth.getName() : null;
        VendorResponse res = vendorService.reviewVendorByAdmin(adminPrincipal, id, req.getAction(), req.getRejectReason());
        return ResponseEntity.ok(ApiResponse.ok("Xét duyệt hồ sơ người bán thành công", res));
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<ApiResponse<Void>> terminateVendor(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody com.vic.ecom.dto.vendor.VendorTerminateRequest req
    ) {
        String adminPrincipal = auth != null ? auth.getName() : null;
        vendorService.terminateVendorAccount(adminPrincipal, id, req.getViolationType(), req.getReason());
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa và vô hiệu hóa tài khoản người bán do vi phạm quy định cấm", null));
    }

    private AdminVendorListItemDto toItemDto(Vendor v) {
        User u = v.getUser();
        Shop s = v.getShop();
        String createdAt = u != null && u.getCreatedAt() != null ? u.getCreatedAt().format(DATE_FMT) : "—";

        String logo = s != null ? s.getLogo() : null;
        if ((logo == null || logo.isBlank()) && v.getKycDocumentUrl() != null) {
            String kyc = v.getKycDocumentUrl();
            if (kyc.contains("\"logo\"")) {
                try {
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(kyc);
                    if (node.has("logo") && !node.get("logo").asText().isBlank()) {
                        logo = node.get("logo").asText();
                    }
                } catch (Exception ignored) {}
            }
        }

        return AdminVendorListItemDto.builder()
                .id(v.getId())
                .userId(u != null ? u.getId() : null)
                .ownerName(u != null ? u.getFullName() : "—")
                .ownerEmail(u != null ? u.getEmail() : "—")
                .ownerPhone(u != null ? u.getPhone() : "—")
                .businessName(v.getBusinessName())
                .shopName(s != null ? s.getName() : v.getBusinessName())
                .shopLogo(logo)
                .shopPickupAddress(s != null ? s.getPickupAddress() : "—")
                .kycDocumentUrl(v.getKycDocumentUrl())
                .approvalStatus(v.getApprovalStatus().name())
                .rejectReason(v.getRejectReason())
                .createdAt(createdAt)
                .build();
    }
}
