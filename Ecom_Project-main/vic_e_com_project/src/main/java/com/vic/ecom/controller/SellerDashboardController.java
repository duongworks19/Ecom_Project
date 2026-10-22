package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.*;
import com.vic.ecom.services.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerDashboardController {

    private final SellerDashboardService sellerDashboardService;

    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<SellerDashboardResponse>> getDashboard(
            @RequestParam(required = false) Long userId
    ) {
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

    @PostMapping("/vouchers")
    public ResponseEntity<ApiResponse<SellerVoucherDto>> createVoucher(
            @RequestBody SellerVoucherDto request
    ) {
        SellerVoucherDto result = sellerDashboardService.createVoucher(request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo mã giảm giá thành công", result));
    }

    @PatchMapping("/vouchers/{voucherId}/toggle")
    public ResponseEntity<ApiResponse<SellerVoucherDto>> toggleVoucher(
            @PathVariable Long voucherId
    ) {
        SellerVoucherDto result = sellerDashboardService.toggleVoucherStatus(voucherId);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái voucher thành công", result));
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

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<SellerShopProfileDto>> updateProfile(
            @RequestBody SellerShopProfileDto request
    ) {
        SellerShopProfileDto result = sellerDashboardService.updateShopProfile(request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật hồ sơ gian hàng thành công", result));
    }
}
