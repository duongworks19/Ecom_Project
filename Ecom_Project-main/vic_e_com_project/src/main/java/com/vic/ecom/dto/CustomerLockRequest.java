package com.vic.ecom.dto;

import jakarta.validation.constraints.Size;

public record CustomerLockRequest(
        @Size(max = 500, message = "Reason must not exceed 500 characters")
        String reason
) {
}
