package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.ShopReview;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.ShopReviewRepository;
import com.vic.ecom.repository.UserRepository;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProductReviewController {

    private final ShopReviewRepository shopReviewRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReviewItemResponse {
        private Long id;
        private String customerName;
        private Integer rating;
        private String comment;
        private String reviewImage;
        private String reply;
        private String shopName;
        private String createdAt;
        private Integer helpfulCount;
        private Boolean verifiedPurchase;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductReviewSummaryResponse {
        private Double averageRating;
        private Integer totalReviews;
        private Integer count5;
        private Integer count4;
        private Integer count3;
        private Integer count2;
        private Integer count1;
        private List<ReviewItemResponse> reviews;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionItemResponse {
        private Long id;
        private String customerName;
        private String question;
        private String answer;
        private String shopName;
        private String createdAt;
    }

    @Data
    public static class CreateReviewRequest {
        private Integer rating;
        private String comment;
        private String reviewImage;
        private String customerName;
        private String productName;
    }

    @Data
    public static class CreateQuestionRequest {
        private String question;
        private String customerName;
        private String productName;
    }

    @GetMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<ProductReviewSummaryResponse>> getProductReviews(@PathVariable Long productId) {
        List<ShopReview> allReviews = shopReviewRepository.findByProductIdAndTypeOrderByIdDesc(productId, "REVIEW");
        if (allReviews.isEmpty()) {
            // Check if there are reviews without explicit type (legacy)
            allReviews = shopReviewRepository.findByProductIdOrderByIdDesc(productId).stream()
                    .filter(r -> !"QA".equalsIgnoreCase(r.getType()))
                    .collect(Collectors.toList());
        }

        int count5 = 0;
        int count4 = 0;
        int count3 = 0;
        int count2 = 0;
        int count1 = 0;
        double sumRating = 0.0;

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        List<ReviewItemResponse> items = new ArrayList<>();

        for (ShopReview r : allReviews) {
            int rate = r.getRating() != null ? r.getRating() : 5;
            sumRating += rate;
            if (rate == 5) count5++;
            else if (rate == 4) count4++;
            else if (rate == 3) count3++;
            else if (rate == 2) count2++;
            else count1++;

            String shopName = r.getShop() != null ? r.getShop().getName() : "VICMART Shop";
            String dateStr = r.getCreatedAt() != null ? r.getCreatedAt().format(dtf) : "Gần đây";

            items.add(ReviewItemResponse.builder()
                    .id(r.getId())
                    .customerName(r.getCustomerName() != null ? r.getCustomerName() : "Khách hàng")
                    .rating(rate)
                    .comment(r.getComment())
                    .reviewImage(r.getReviewImage())
                    .reply(r.getReply())
                    .shopName(shopName)
                    .createdAt(r.getCreatedAtLabel() != null ? r.getCreatedAtLabel() : dateStr)
                    .helpfulCount(r.getHelpfulCount() != null ? r.getHelpfulCount() : 0)
                    .verifiedPurchase(r.getVerifiedPurchase() != null ? r.getVerifiedPurchase() : true)
                    .build());
        }

        double avg = allReviews.isEmpty() ? 5.0 : Math.round((sumRating / allReviews.size()) * 10.0) / 10.0;

        ProductReviewSummaryResponse summary = ProductReviewSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(allReviews.size())
                .count5(count5)
                .count4(count4)
                .count3(count3)
                .count2(count2)
                .count1(count1)
                .reviews(items)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Đánh giá sản phẩm", summary));
    }

    @PostMapping("/{productId}/reviews")
    public ResponseEntity<ApiResponse<ReviewItemResponse>> submitReview(
            @PathVariable Long productId,
            @RequestBody CreateReviewRequest request,
            Authentication auth
    ) {
        Product product = productRepository.findById(productId).orElse(null);
        Shop shop = product != null ? product.getShop() : null;
        if (shop == null) {
            shop = shopRepository.findAll().stream().findFirst().orElse(null);
        }
        if (shop == null) {
            shop = new Shop();
            shop.setName("VICMART Shop");
            shop.setRatingAvg(BigDecimal.valueOf(5.0));
            shop = shopRepository.save(shop);
        }

        User user = null;
        if (auth != null && auth.getName() != null) {
            user = userRepository.findByEmail(auth.getName())
                    .or(() -> userRepository.findByPhone(auth.getName()))
                    .orElse(null);
        }

        String authorName = request.getCustomerName();
        if ((authorName == null || authorName.isBlank()) && user != null) {
            authorName = user.getName() != null ? user.getName() : user.getEmail();
        }
        if (authorName == null || authorName.isBlank()) {
            authorName = "Khách hàng mua sắm";
        }

        String prodName = product != null ? product.getName() : (request.getProductName() != null && !request.getProductName().isBlank() ? request.getProductName() : "Sản phẩm #" + productId);
        String prodImage = product != null ? product.getImageUrl() : request.getReviewImage();

        ShopReview review = new ShopReview();
        review.setShop(shop);
        review.setCustomer(user);
        review.setCustomerName(authorName);
        review.setProductId(productId);
        review.setProductName(prodName);
        review.setProductImage(prodImage);
        review.setRating(request.getRating() != null ? Math.max(1, Math.min(5, request.getRating())) : 5);
        review.setComment(request.getComment());
        review.setReviewImage(request.getReviewImage());
        review.setType("REVIEW");
        review.setHelpfulCount(0);
        review.setVerifiedPurchase(true);
        review.setCreatedAtLabel("Vừa xong");

        ShopReview saved = shopReviewRepository.save(review);

        // Update shop rating avg
        if (shop != null && shop.getId() != null) {
            List<ShopReview> shopReviews = shopReviewRepository.findByShopIdAndTypeOrderByIdDesc(shop.getId(), "REVIEW");
            if (!shopReviews.isEmpty()) {
                double avg = shopReviews.stream()
                        .mapToInt(r -> r.getRating() != null ? r.getRating() : 5)
                        .average()
                        .orElse(5.0);
                shop.setRatingAvg(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
                shopRepository.save(shop);
            }
        }

        ReviewItemResponse response = ReviewItemResponse.builder()
                .id(saved.getId())
                .customerName(saved.getCustomerName())
                .rating(saved.getRating())
                .comment(saved.getComment())
                .reviewImage(saved.getReviewImage())
                .reply(saved.getReply())
                .shopName(shop != null ? shop.getName() : "VICMART Shop")
                .createdAt("Vừa xong")
                .helpfulCount(0)
                .verifiedPurchase(true)
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Gửi đánh giá thành công", response));
    }

    @GetMapping("/{productId}/questions")
    public ResponseEntity<ApiResponse<List<QuestionItemResponse>>> getProductQuestions(@PathVariable Long productId) {
        List<ShopReview> questions = shopReviewRepository.findByProductIdAndTypeOrderByIdDesc(productId, "QA");
        if (questions.isEmpty()) {
            questions = shopReviewRepository.findByProductIdOrderByIdDesc(productId).stream()
                    .filter(q -> "QA".equalsIgnoreCase(q.getType()) || (q.getRating() != null && q.getRating() == 0))
                    .collect(Collectors.toList());
        }
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        List<QuestionItemResponse> items = questions.stream().map(q -> {
            String shopName = q.getShop() != null ? q.getShop().getName() : "VICMART Shop";
            String dateStr = q.getCreatedAt() != null ? q.getCreatedAt().format(dtf) : "Gần đây";
            return QuestionItemResponse.builder()
                    .id(q.getId())
                    .customerName(q.getCustomerName() != null ? q.getCustomerName() : "Khách hàng")
                    .question(q.getComment())
                    .answer(q.getReply())
                    .shopName(shopName)
                    .createdAt(q.getCreatedAtLabel() != null ? q.getCreatedAtLabel() : dateStr)
                    .build();
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok("Danh sách hỏi đáp", items));
    }

    @PostMapping("/{productId}/questions")
    public ResponseEntity<ApiResponse<QuestionItemResponse>> submitQuestion(
            @PathVariable Long productId,
            @RequestBody CreateQuestionRequest request,
            Authentication auth
    ) {
        Product product = productRepository.findById(productId).orElse(null);
        Shop shop = product != null ? product.getShop() : null;
        if (shop == null) {
            shop = shopRepository.findAll().stream().findFirst().orElse(null);
        }
        if (shop == null) {
            shop = new Shop();
            shop.setName("VICMART Shop");
            shop.setRatingAvg(BigDecimal.valueOf(5.0));
            shop = shopRepository.save(shop);
        }

        User user = null;
        if (auth != null && auth.getName() != null) {
            user = userRepository.findByEmail(auth.getName())
                    .or(() -> userRepository.findByPhone(auth.getName()))
                    .orElse(null);
        }

        String authorName = request.getCustomerName();
        if ((authorName == null || authorName.isBlank()) && user != null) {
            authorName = user.getName() != null ? user.getName() : user.getEmail();
        }
        if (authorName == null || authorName.isBlank()) {
            authorName = "Khách hàng";
        }

        String prodName = product != null ? product.getName() : (request.getProductName() != null && !request.getProductName().isBlank() ? request.getProductName() : "Sản phẩm #" + productId);
        String prodImage = product != null ? product.getImageUrl() : null;

        ShopReview qa = new ShopReview();
        qa.setShop(shop);
        qa.setCustomer(user);
        qa.setCustomerName(authorName);
        qa.setProductId(productId);
        qa.setProductName(prodName);
        qa.setProductImage(prodImage);
        qa.setRating(0);
        qa.setComment(request.getQuestion());
        qa.setType("QA");
        qa.setCreatedAtLabel("Vừa xong");

        ShopReview saved = shopReviewRepository.save(qa);

        QuestionItemResponse res = QuestionItemResponse.builder()
                .id(saved.getId())
                .customerName(saved.getCustomerName())
                .question(saved.getComment())
                .answer(saved.getReply())
                .shopName(shop != null ? shop.getName() : "VICMART Shop")
                .createdAt("Vừa xong")
                .build();

        return ResponseEntity.ok(ApiResponse.ok("Gửi câu hỏi thành công", res));
    }

    @PostMapping("/reviews/{reviewId}/helpful")
    public ResponseEntity<ApiResponse<Integer>> voteHelpful(@PathVariable Long reviewId) {
        ShopReview review = shopReviewRepository.findById(reviewId).orElse(null);
        if (review != null) {
            int count = (review.getHelpfulCount() != null ? review.getHelpfulCount() : 0) + 1;
            review.setHelpfulCount(count);
            shopReviewRepository.save(review);
            return ResponseEntity.ok(ApiResponse.ok("Đã ghi nhận hữu ích", count));
        }
        return ResponseEntity.notFound().build();
    }
}
