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
@RequestMapping("/api/seller/questions")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerQuestionController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerReviewQuestionDto>>> getQuestions(
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        List<SellerReviewQuestionDto> questions = sellerDashboardService.getQuestions(userId);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách câu hỏi của gian hàng", questions));
    }

    @PostMapping("/{questionId}/reply")
    public ResponseEntity<ApiResponse<SellerReviewQuestionDto>> replyQuestion(
            @PathVariable Long questionId,
            @RequestBody Map<String, String> payload
    ) {
        String reply = payload != null ? payload.getOrDefault("reply", "") : "";
        SellerReviewQuestionDto result = sellerDashboardService.replyReview(questionId, reply);
        return ResponseEntity.ok(ApiResponse.ok("Trả lời câu hỏi thành công", result));
    }
}
