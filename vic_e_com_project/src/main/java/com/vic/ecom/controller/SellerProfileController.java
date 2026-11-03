package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.SellerShopProfileDto;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller/profile")
@RequiredArgsConstructor
public class SellerProfileController {
    private final SellerDashboardService sellerDashboardService;
    private final UserRepository users;

    @GetMapping
    public ResponseEntity<ApiResponse<SellerShopProfileDto>> get(Authentication authentication) {
        String principal = authentication == null ? null : authentication.getName();
        Long userId = principal == null ? null : users.findByEmail(principal)
                .or(() -> users.findByPhone(principal))
                .map(User::getId).orElse(null);
        return ResponseEntity.ok(ApiResponse.ok("Thông tin hồ sơ gian hàng",
                sellerDashboardService.getShopProfile(userId)));
    }
}
