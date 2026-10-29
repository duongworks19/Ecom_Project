package com.vic.ecom.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductReviewSummaryResponse {
    private Double averageRating;
    private Integer totalReviews;
    private Integer count5;
    private Integer count4;
    private Integer count3;
    private Integer count2;
    private Integer count1;
    private List<ReviewItemResponse> reviews;
}
