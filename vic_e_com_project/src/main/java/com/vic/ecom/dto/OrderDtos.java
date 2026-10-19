package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class OrderDtos {

    private OrderDtos() {
    }

    public record OrderItemDto(
            Long productId,
            String productName,
            String variantLabel,
            String thumbnailUrl,
            int quantity,
            BigDecimal unitPrice,
            BigDecimal lineTotal
    ) {
    }

    public record OrderCardDto(
            Long id,
            String orderCode,
            Long shopId,
            String shopName,
            String status,
            LocalDateTime createdAt,
            BigDecimal totalAmount,
            boolean canCancel,
            List<OrderItemDto> items
    ) {
    }

    public record OrderPageDto(
            List<OrderCardDto> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            Map<String, Long> countsByStatus
    ) {
    }

    public record CancelOrderRequest(
            String reason
    ) {
    }

    public record RebuyResponse(
            int addedItemCount
    ) {
    }
}
