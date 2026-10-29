package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.review.CreateQuestionRequest;
import com.vic.ecom.dto.review.CreateReviewRequest;
import com.vic.ecom.dto.review.ProductReviewSummaryResponse;
import com.vic.ecom.dto.review.QuestionItemResponse;
import com.vic.ecom.dto.review.ReviewItemResponse;
import com.vic.ecom.services.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<ProductReviewSummaryResponse>> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok("Đánh giá sản phẩm", productReviewService.getProductReviews(productId)));
    }

    @PostMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<ReviewItemResponse>> submitReview(
            @PathVariable Long productId,
            @RequestBody CreateReviewRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Gửi đánh giá thành công",
                productReviewService.submitReview(productId, request, auth)));
    }

    @GetMapping("/{productId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionItemResponse>>> getProductQuestions(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok("Danh sách hỏi đáp", productReviewService.getProductQuestions(productId)));
    }

    @PostMapping("/{productId}/questions")
    public ResponseEntity<ApiResponse<QuestionItemResponse>> submitQuestion(
            @PathVariable Long productId,
            @RequestBody CreateQuestionRequest request,
            Authentication auth
    ) {
        return ResponseEntity.ok(ApiResponse.ok("Gửi câu hỏi thành công",
                productReviewService.submitQuestion(productId, request, auth)));
    }

    @PostMapping("/reviews/{reviewId}/helpful")
    public ResponseEntity<ApiResponse<Integer>> voteHelpful(@PathVariable Long reviewId) {
        Integer count = productReviewService.voteHelpful(reviewId);
        if (count == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận hữu ích", count));
    }
}
