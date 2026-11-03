package com.vic.ecom.controller.seller.marketing;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.SellerPromotionDto;
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
@RequestMapping("/api/seller/campaigns")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerCampaignController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerPromotionDto>>> getCampaigns(Authentication authentication) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        List<SellerPromotionDto> campaigns = sellerDashboardService.getCampaigns(userId);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách chương trình giảm giá của shop", campaigns));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SellerPromotionDto>> createCampaign(
            Authentication authentication,
            @RequestBody SellerPromotionDto request
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        SellerPromotionDto result = sellerDashboardService.createCampaign(userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Tạo chương trình giảm giá thành công", result));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<SellerPromotionDto>> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> payload
    ) {
        String status = payload != null ? payload.getOrDefault("status", "ACTIVE") : "ACTIVE";
        SellerPromotionDto result = sellerDashboardService.updateCampaignStatus(id, status);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công", result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteCampaign(@PathVariable Long id) {
        sellerDashboardService.deleteCampaign(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa chương trình thành công", null));
    }
}
