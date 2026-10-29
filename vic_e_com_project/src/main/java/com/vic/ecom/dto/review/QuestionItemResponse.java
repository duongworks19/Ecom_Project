package com.vic.ecom.dto.review;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuestionItemResponse {
    private Long id;
    private String customerName;
    private String question;
    private String answer;
    private String shopName;
    private String createdAt;
}
