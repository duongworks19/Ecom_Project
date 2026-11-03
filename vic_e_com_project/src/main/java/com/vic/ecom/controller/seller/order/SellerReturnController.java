package com.vic.ecom.controller.seller.order;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.SellerReturnDto;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/seller/returns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerReturnController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerReturnDto>>> getReturns(Authentication authentication) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        List<SellerReturnDto> returns = sellerDashboardService.getReturns(userId);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách yêu cầu đổi trả của shop", returns));
    }

    @PostMapping("/{id}/action")
    public ResponseEntity<ApiResponse<SellerReturnDto>> handleReturnAction(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload
    ) {
        String action = payload != null ? payload.getOrDefault("action", "APPROVE") : "APPROVE";
        String note = payload != null ? payload.getOrDefault("reason", "") : "";
        SellerReturnDto result = sellerDashboardService.updateReturnStatus(id, action, note);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật yêu cầu đổi trả thành công", result));
    }
}
