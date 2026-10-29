package com.vic.ecom.controller.seller.care;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.SellerReviewQuestionDto;
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
@RequestMapping("/api/seller/reviews")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerReviewController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerReviewQuestionDto>>> getReviews(
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        List<SellerReviewQuestionDto> reviews = sellerDashboardService.getReviews(userId);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách đánh giá của gian hàng", reviews));
    }

    @PostMapping("/{reviewId}/reply")
    public ResponseEntity<ApiResponse<SellerReviewQuestionDto>> replyReview(
            @PathVariable Long reviewId,
            @RequestBody Map<String, String> payload
    ) {
        String reply = payload != null ? payload.getOrDefault("reply", "") : "";
        SellerReviewQuestionDto result = sellerDashboardService.replyReview(reviewId, reply);
        return ResponseEntity.ok(ApiResponse.ok("Phản hồi khách hàng thành công", result));
    }
}
