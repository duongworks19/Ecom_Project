package com.vic.ecom.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewItemResponse {
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
