package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.*;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerDashboardController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<SellerDashboardResponse>> getDashboard(
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        SellerDashboardResponse response = sellerDashboardService.getDashboardData(userId);
        return ResponseEntity.ok(ApiResponse.ok("Dữ liệu trang chủ kênh người bán", response));
    }

    @PostMapping("/orders/{orderCode}/action")
    public ResponseEntity<ApiResponse<SellerRecentOrderDto>> quickActionOrder(
            @PathVariable String orderCode,
            @RequestBody OrderQuickActionRequest request
    ) {
        SellerRecentOrderDto result = sellerDashboardService.handleQuickAction(orderCode, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái đơn hàng thành công", result));
    }

    @PatchMapping("/inventory/{productId}/stock")
    public ResponseEntity<ApiResponse<SellerLowStockDto>> updateStock(
            @PathVariable Long productId,
            @RequestBody SellerStockUpdateRequest request
    ) {
        SellerLowStockDto result = sellerDashboardService.updateProductStock(productId, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tồn kho thành công", result));
    }

    @PostMapping("/products")
    public ResponseEntity<ApiResponse<SellerProductDto>> createProduct(
            @RequestBody SellerProductDto request
    ) {
        SellerProductDto result = sellerDashboardService.createProduct(request);
        return ResponseEntity.ok(ApiResponse.ok("Thêm sản phẩm mới thành công", result));
    }

    @PostMapping("/reviews/{reviewId}/reply")
    public ResponseEntity<ApiResponse<SellerReviewQuestionDto>> replyReview(
            @PathVariable Long reviewId,
            @RequestBody java.util.Map<String, String> payload
    ) {
        String reply = payload != null ? payload.getOrDefault("reply", "") : "";
        SellerReviewQuestionDto result = sellerDashboardService.replyReview(reviewId, reply);
        return ResponseEntity.ok(ApiResponse.ok("Phản hồi khách hàng thành công", result));
    }

    @PostMapping("/questions/{questionId}/reply")
    public ResponseEntity<ApiResponse<SellerReviewQuestionDto>> replyQuestion(
            @PathVariable Long questionId,
            @RequestBody java.util.Map<String, String> payload
    ) {
        String reply = payload != null ? payload.getOrDefault("reply", "") : "";
        SellerReviewQuestionDto result = sellerDashboardService.replyReview(questionId, reply);
        return ResponseEntity.ok(ApiResponse.ok("Trả lời câu hỏi thành công", result));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<SellerShopProfileDto>> updateProfile(
            @RequestBody SellerShopProfileDto request
    ) {
        SellerShopProfileDto result = sellerDashboardService.updateShopProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hồ sơ gian hàng thành công", result));
    }
}
