package com.vic.ecom.dto.review;

import lombok.Data;

@Data
public class CreateReviewRequest {
    private Integer rating;
    private String comment;
    private String reviewImage;
    private String customerName;
    private String productName;
}
