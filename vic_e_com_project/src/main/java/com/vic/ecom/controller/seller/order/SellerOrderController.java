package com.vic.ecom.controller.seller.order;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.OrderQuickActionRequest;
import com.vic.ecom.dto.seller.SellerRecentOrderDto;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/orders")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerOrderController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerRecentOrderDto>>> getOrders(
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        List<SellerRecentOrderDto> orders = sellerDashboardService.getOrders(userId);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách đơn hàng của người bán", orders));
    }

    @PostMapping("/{orderCode}/action")
    public ResponseEntity<ApiResponse<SellerRecentOrderDto>> quickActionOrder(
            @PathVariable String orderCode,
            @RequestBody OrderQuickActionRequest request
    ) {
        SellerRecentOrderDto result = sellerDashboardService.handleQuickAction(orderCode, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái đơn hàng thành công", result));
    }
}
