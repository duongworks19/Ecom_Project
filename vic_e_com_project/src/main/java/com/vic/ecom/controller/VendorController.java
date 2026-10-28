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

    @GetMapping("/check-name")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkShopName(@RequestParam String name) {
        VendorService.ShopNameValidationResult result = vendorService.validateShopName(name);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra tên gian hàng", Map.of(
                "isAvailable", result.isAvailable(),
                "message", result.message()
        )));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmail(
            @RequestParam String email,
            Authentication auth) {
        Long currentUserId = null;
        if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            currentUserId = userRepository.findByEmail(auth.getName())
                    .or(() -> userRepository.findByPhone(auth.getName()))
                    .map(User::getId)
                    .orElse(null);
        }
        boolean available = vendorService.isEmailAvailable(email, currentUserId);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra email", Map.of(
                "isAvailable", available,
                "message", available ? "Email hợp lệ và khả dụng" : "Email này đã được sử dụng trên hệ thống"
        )));
    }

    @GetMapping("/check-phone")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkPhone(
            @RequestParam String phone,
            Authentication auth) {
        Long currentUserId = null;
        if (auth != null && auth.isAuthenticated() && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            currentUserId = userRepository.findByEmail(auth.getName())
                    .or(() -> userRepository.findByPhone(auth.getName()))
                    .map(User::getId)
                    .orElse(null);
        }
        boolean available = vendorService.isPhoneAvailable(phone, currentUserId, null);
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra số điện thoại", Map.of(
                "isAvailable", available,
                "message", available ? "Số điện thoại hợp lệ và khả dụng" : "Số điện thoại này đã được đăng ký trên hệ thống"
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

    @PutMapping("/resubmit")
    public ResponseEntity<ApiResponse<VendorResponse>> resubmitVendor(
            Authentication auth,
            @RequestBody VendorRegisterRequest req) {
        Long userId = extractUserId(auth);
        VendorResponse res = vendorService.registerVendor(userId, req);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật bổ sung thông tin hồ sơ thành công, vui lòng chờ duyệt", res));
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

    private Long extractUserId(Authentication auth) {
        if (auth == null || auth.getName() == null || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            throw new IllegalArgumentException("Vui lòng đăng nhập trước khi thực hiện thao tác");
        }
        String principal = auth.getName();
        return userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản người dùng: " + principal));
    }
}