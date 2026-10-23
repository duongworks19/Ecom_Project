package com.vic.ecom.dto.seller.product;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductStatusRequest {
    private String status; // VISIBLE, HIDDEN, DRAFT, DELETED
}
