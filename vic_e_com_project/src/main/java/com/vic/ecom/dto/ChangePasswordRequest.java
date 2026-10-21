package com.vic.ecom.dto;

public record ChangePasswordRequest(String currentPassword, String newPassword) {
}
