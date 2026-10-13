package com.vic.ecom.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class LoginRequest {

    // Accepts email or phone — service decides which field to query
    @NotBlank(message = "Username (email or phone) is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;
}
