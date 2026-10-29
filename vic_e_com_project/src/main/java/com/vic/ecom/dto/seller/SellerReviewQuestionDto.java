package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerReviewQuestionDto {
    private Long id;
    private String customerName;
    private String productName;
    private String productImage;
    private Integer rating;
    private String comment;
    private String createdAt;
    private Long productId;
    private String type;
    private String reviewImage;
    private Integer helpfulCount;
    private Boolean verifiedPurchase;
    private String reply;
}
