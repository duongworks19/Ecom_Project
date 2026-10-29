package com.vic.ecom.services;

import com.vic.ecom.dto.review.CreateQuestionRequest;
import com.vic.ecom.dto.review.CreateReviewRequest;
import com.vic.ecom.dto.review.ProductReviewSummaryResponse;
import com.vic.ecom.dto.review.QuestionItemResponse;
import com.vic.ecom.dto.review.ReviewItemResponse;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.ShopReview;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.ShopReviewRepository;
import com.vic.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductReviewService {

    private static final String TYPE_REVIEW = "REVIEW";
    private static final String TYPE_QA = "QA";
    private static final String DEFAULT_SHOP_NAME = "VICMART Shop";
    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private final ShopReviewRepository shopReviewRepository;
    private final ProductRepository productRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;

    public ProductReviewSummaryResponse getProductReviews(Long productId) {
        List<ShopReview> allReviews = shopReviewRepository.findByProductIdAndTypeOrderByIdDesc(productId, TYPE_REVIEW);
        if (allReviews.isEmpty()) {
            // Đánh giá cũ chưa có type
            allReviews = shopReviewRepository.findByProductIdOrderByIdDesc(productId).stream()
                    .filter(r -> !TYPE_QA.equalsIgnoreCase(r.getType()))
                    .collect(Collectors.toList());
        }

        int count5 = 0, count4 = 0, count3 = 0, count2 = 0, count1 = 0;
        double sumRating = 0.0;
        List<ReviewItemResponse> items = new ArrayList<>();

        for (ShopReview r : allReviews) {
            int rate = r.getRating() != null ? r.getRating() : 5;
            sumRating += rate;
            if (rate == 5) count5++;
            else if (rate == 4) count4++;
            else if (rate == 3) count3++;
            else if (rate == 2) count2++;
            else count1++;

            items.add(ReviewItemResponse.builder()
                    .id(r.getId())
                    .customerName(r.getCustomerName() != null ? r.getCustomerName() : "Khách hàng")
                    .rating(rate)
                    .comment(r.getComment())
                    .reviewImage(r.getReviewImage())
                    .reply(r.getReply())
                    .shopName(shopNameOf(r))
                    .createdAt(createdLabelOf(r))
                    .helpfulCount(r.getHelpfulCount() != null ? r.getHelpfulCount() : 0)
                    .verifiedPurchase(r.getVerifiedPurchase() != null ? r.getVerifiedPurchase() : true)
                    .build());
        }

        double avg = allReviews.isEmpty() ? 5.0 : Math.round((sumRating / allReviews.size()) * 10.0) / 10.0;

        return ProductReviewSummaryResponse.builder()
                .averageRating(avg)
                .totalReviews(allReviews.size())
                .count5(count5)
                .count4(count4)
                .count3(count3)
                .count2(count2)
                .count1(count1)
                .reviews(items)
                .build();
    }

    public ReviewItemResponse submitReview(Long productId, CreateReviewRequest request, Authentication auth) {
        Product product = productRepository.findById(productId).orElse(null);
        Shop shop = resolveShop(product);
        User user = resolveUser(auth);
        String authorName = resolveAuthorName(request.getCustomerName(), user, "Khách hàng mua sắm");

        ShopReview review = new ShopReview();
        review.setShop(shop);
        review.setCustomer(user);
        review.setCustomerName(authorName);
        review.setProductId(productId);
        review.setProductName(resolveProductName(product, request.getProductName(), productId));
        review.setProductImage(product != null ? product.getImageUrl() : request.getReviewImage());
        review.setRating(request.getRating() != null ? Math.max(1, Math.min(5, request.getRating())) : 5);
        review.setComment(request.getComment());
        review.setReviewImage(request.getReviewImage());
        review.setType(TYPE_REVIEW);
        review.setHelpfulCount(0);
        review.setVerifiedPurchase(true);
        review.setCreatedAtLabel("Vừa xong");

        ShopReview saved = shopReviewRepository.save(review);
        updateShopRating(shop);

        return ReviewItemResponse.builder()
                .id(saved.getId())
                .customerName(saved.getCustomerName())
                .rating(saved.getRating())
                .comment(saved.getComment())
                .reviewImage(saved.getReviewImage())
                .reply(saved.getReply())
                .shopName(shop != null ? shop.getName() : DEFAULT_SHOP_NAME)
                .createdAt("Vừa xong")
                .helpfulCount(0)
                .verifiedPurchase(true)
                .build();
    }

    public List<QuestionItemResponse> getProductQuestions(Long productId) {
        List<ShopReview> questions = shopReviewRepository.findByProductIdAndTypeOrderByIdDesc(productId, TYPE_QA);
        if (questions.isEmpty()) {
            questions = shopReviewRepository.findByProductIdOrderByIdDesc(productId).stream()
                    .filter(q -> TYPE_QA.equalsIgnoreCase(q.getType()) || (q.getRating() != null && q.getRating() == 0))
                    .collect(Collectors.toList());
        }

        return questions.stream()
                .map(q -> QuestionItemResponse.builder()
                        .id(q.getId())
                        .customerName(q.getCustomerName() != null ? q.getCustomerName() : "Khách hàng")
                        .question(q.getComment())
                        .answer(q.getReply())
                        .shopName(shopNameOf(q))
                        .createdAt(createdLabelOf(q))
                        .build())
                .collect(Collectors.toList());
    }

    public QuestionItemResponse submitQuestion(Long productId, CreateQuestionRequest request, Authentication auth) {
        Product product = productRepository.findById(productId).orElse(null);
        Shop shop = resolveShop(product);
        User user = resolveUser(auth);
        String authorName = resolveAuthorName(request.getCustomerName(), user, "Khách hàng");

        ShopReview qa = new ShopReview();
        qa.setShop(shop);
        qa.setCustomer(user);
        qa.setCustomerName(authorName);
        qa.setProductId(productId);
        qa.setProductName(resolveProductName(product, request.getProductName(), productId));
        qa.setProductImage(product != null ? product.getImageUrl() : null);
        qa.setRating(0);
        qa.setComment(request.getQuestion());
        qa.setType(TYPE_QA);
        qa.setCreatedAtLabel("Vừa xong");

        ShopReview saved = shopReviewRepository.save(qa);

        return QuestionItemResponse.builder()
                .id(saved.getId())
                .customerName(saved.getCustomerName())
                .question(saved.getComment())
                .answer(saved.getReply())
                .shopName(shop != null ? shop.getName() : DEFAULT_SHOP_NAME)
                .createdAt("Vừa xong")
                .build();
    }

    /** Trả về số lượt hữu ích mới, hoặc null nếu không tìm thấy đánh giá. */
    public Integer voteHelpful(Long reviewId) {
        ShopReview review = shopReviewRepository.findById(reviewId).orElse(null);
        if (review == null) {
            return null;
        }
        int count = (review.getHelpfulCount() != null ? review.getHelpfulCount() : 0) + 1;
        review.setHelpfulCount(count);
        shopReviewRepository.save(review);
        return count;
    }

    private Shop resolveShop(Product product) {
        Shop shop = product != null ? product.getShop() : null;
        if (shop == null) {
            shop = shopRepository.findAll().stream().findFirst().orElse(null);
        }
        if (shop == null) {
            shop = new Shop();
            shop.setName(DEFAULT_SHOP_NAME);
            shop.setRatingAvg(BigDecimal.valueOf(5.0));
            shop = shopRepository.save(shop);
        }
        return shop;
    }

    private User resolveUser(Authentication auth) {
        if (auth == null || auth.getName() == null) {
            return null;
        }
        return userRepository.findByEmail(auth.getName())
                .or(() -> userRepository.findByPhone(auth.getName()))
                .orElse(null);
    }

    private String resolveAuthorName(String requested, User user, String fallback) {
        String authorName = requested;
        if ((authorName == null || authorName.isBlank()) && user != null) {
            authorName = user.getName() != null ? user.getName() : user.getEmail();
        }
        return (authorName == null || authorName.isBlank()) ? fallback : authorName;
    }

    private String resolveProductName(Product product, String requested, Long productId) {
        if (product != null) {
            return product.getName();
        }
        return (requested != null && !requested.isBlank()) ? requested : "Sản phẩm #" + productId;
    }

    private void updateShopRating(Shop shop) {
        if (shop == null || shop.getId() == null) {
            return;
        }
        List<ShopReview> shopReviews = shopReviewRepository.findByShopIdAndTypeOrderByIdDesc(shop.getId(), TYPE_REVIEW);
        if (shopReviews.isEmpty()) {
            return;
        }
        double avg = shopReviews.stream()
                .mapToInt(r -> r.getRating() != null ? r.getRating() : 5)
                .average()
                .orElse(5.0);
        shop.setRatingAvg(BigDecimal.valueOf(avg).setScale(1, RoundingMode.HALF_UP));
        shopRepository.save(shop);
    }

    private String shopNameOf(ShopReview r) {
        return r.getShop() != null ? r.getShop().getName() : DEFAULT_SHOP_NAME;
    }

    private String createdLabelOf(ShopReview r) {
        if (r.getCreatedAtLabel() != null) {
            return r.getCreatedAtLabel();
        }
        return r.getCreatedAt() != null ? r.getCreatedAt().format(DATE_FORMAT) : "Gần đây";
    }
}
