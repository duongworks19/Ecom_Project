package com.vic.ecom.dto;

public final class ProfileDtos {

    private ProfileDtos() {
    }

    public record ProfileResponse(
            Long id,
            String fullName,
            String email,
            String phone,
            String avatarUrl
    ) {
    }

    public record UpdateProfileRequest(
            String fullName,
            String phone
    ) {
    }

    public record AvatarResponse(
            String avatarUrl
    ) {
    }

    public record ErrorBody(
            int status,
            String code,
            String message,
            String field
    ) {
    }
}
