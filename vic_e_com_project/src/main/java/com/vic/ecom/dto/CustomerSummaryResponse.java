package com.vic.ecom.dto;

public record CustomerSummaryResponse(
        long total,
        long active,
        long locked,
        long newLast7Days
) {
}
