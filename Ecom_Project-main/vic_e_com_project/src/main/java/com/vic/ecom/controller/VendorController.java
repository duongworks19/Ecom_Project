package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.vendor.VendorApprovalRequest;
import com.vic.ecom.dto.vendor.VendorRegisterRequest;
import com.vic.ecom.dto.vendor.VendorResponse;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<java.util.List<VendorResponse>>> getVendors(
            @RequestParam(required = false) com.vic.ecom.enums.ApprovalStatus status) {
        java.util.List<VendorResponse> list = status != null
                ? vendorService.getVendorsByStatus(status)
                : vendorService.getAllVendors();
        return ResponseEntity.ok(ApiResponse.ok("Danh sách hồ sơ người bán", list));
    }

    @GetMapping("/check-name")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkShopName(@RequestParam String name) {
        boolean available = vendorService.isShopNameAvailable(name);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra tên gian hàng", Map.of(
                "isAvailable", available,
                "message", available ? "Tên gian hàng hợp lệ và khả dụng" : "Tên gian hàng đã tồn tại hoặc không hợp lệ"
        )));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<VendorResponse>> getMyVendorProfile(Authentication auth) {
        Long userId = extractUserId(auth);
        VendorResponse res = vendorService.getMyVendorProfile(userId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin người bán", res));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<VendorResponse>> registerVendor(
            Authentication auth,
            @Valid @RequestBody VendorRegisterRequest req) {
        Long userId = extractUserId(auth);
        VendorResponse res = vendorService.registerVendor(userId, req);
        return ResponseEntity.status(201).body(ApiResponse.ok("Đăng ký người bán thành công, vui lòng chờ duyệt", res));
    }

    @PostMapping("/{id}/review")
    public ResponseEntity<ApiResponse<VendorResponse>> reviewVendor(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody VendorApprovalRequest req) {
        Long adminId = extractUserId(auth);
        VendorResponse res = vendorService.reviewVendor(adminId, id, req.getAction(), req.getRejectReason());
        return ResponseEntity.ok(ApiResponse.ok("Xét duyệt hồ sơ người bán thành công", res));
    }

    @PostMapping("/{id}/terminate")
    public ResponseEntity<ApiResponse<Void>> terminateVendor(
            Authentication auth,
            @PathVariable Long id,
            @Valid @RequestBody com.vic.ecom.dto.vendor.VendorTerminateRequest req) {
        Long adminId = extractUserId(auth);
        vendorService.terminateVendorAccount(adminId, id, req.getViolationType(), req.getReason());
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa và vô hiệu hóa tài khoản người bán do vi phạm luật cấm", null));
    }

    private Long extractUserId(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return 1L;
        }
        String principal = auth.getName();
        return userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(1L);
    }
}
