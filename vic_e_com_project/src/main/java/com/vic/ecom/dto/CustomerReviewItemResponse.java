package com.vic.ecom.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CustomerReviewItemResponse(
        Long id,
        Long productId,
        String productName,
        String orderCode,
        Integer rating,
        String comment,
        List<MediaItem> media,
        VendorReplyItem vendorReply,
        LocalDateTime createdAt
) {
    public record MediaItem(
            String url,
            String type
    ) {
    }

    public record VendorReplyItem(
            String content,
            LocalDateTime createdAt
    ) {
    }
}
