package com.vic.ecom.dto;

import lombok.Getter;

@Getter
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role;
    private Long userId;
    private String fullName;
    private String email;

    public AuthResponse(String accessToken, String tokenType, String role, Long userId, String fullName, String email) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.role = role;
        this.userId = userId;
        this.fullName = fullName;
        this.email = email;
    }

    public AuthResponse(String accessToken, String tokenType, String role, Long userId) {
        this(accessToken, tokenType, role, userId, null, null);
    }

    public AuthResponse(String accessToken, String role, Long userId) {
        this(accessToken, "Bearer", role, userId, null, null);
    }

    public AuthResponse(String accessToken, String role, Long userId, String fullName, String email) {
        this(accessToken, "Bearer", role, userId, fullName, email);
    }
}
