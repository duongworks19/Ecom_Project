package com.vic.ecom.dto.review;

import lombok.Data;

@Data
public class CreateQuestionRequest {
    private String question;
    private String customerName;
    private String productName;
}
