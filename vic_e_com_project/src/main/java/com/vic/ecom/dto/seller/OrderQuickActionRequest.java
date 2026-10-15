package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderQuickActionRequest {
    private String action; // "CONFIRM", "MARK_PACKED", "REVIEW_REFUND"
    private String note;
}
