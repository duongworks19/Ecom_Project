package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record CustomerOrderItemResponse(
        Long id,
        String orderCode,
        BigDecimal totalAmount,
        String status,
        String paymentMethod,
        String paymentStatus,
        String shippingStatus,
        LocalDateTime createdAt
) {
}
