package com.vic.ecom.dto;

import lombok.Getter;

@Getter
public class AuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String role;
    private Long userId;

    public AuthResponse(String accessToken, String tokenType, String role, Long userId) {
        this.accessToken = accessToken;
        this.tokenType = tokenType;
        this.role = role;
        this.userId = userId;
    }

    public AuthResponse(String accessToken, String role, Long userId) {
        this.accessToken = accessToken;
        this.role = role;
        this.userId = userId;
    }
}
