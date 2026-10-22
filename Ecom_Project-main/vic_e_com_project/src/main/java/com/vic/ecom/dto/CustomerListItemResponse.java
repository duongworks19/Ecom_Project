package com.vic.ecom.dto;

import java.time.LocalDateTime;

public record CustomerListItemResponse(
        Long id,
        String fullName,
        String email,
        String avatarUrl,
        String status,
        LocalDateTime createdAt
) {
}
