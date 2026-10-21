package com.vic.ecom.controller;

import com.vic.ecom.dto.AuthOtpDtos;
import com.vic.ecom.dto.ProfileDtos;
import com.vic.ecom.services.ForgotPasswordService;
import com.vic.ecom.ultis.CustomerAccountException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class ForgotPasswordController {

    private final ForgotPasswordService forgotPasswordService;

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody AuthOtpDtos.ForgotPasswordRequest req) {
        forgotPasswordService.requestOtp(req.email());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<Void> verifyOtp(@Valid @RequestBody AuthOtpDtos.VerifyOtpRequest req) {
        forgotPasswordService.verifyOtp(req.email(), req.otp());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody AuthOtpDtos.ResetPasswordRequest req) {
        forgotPasswordService.resetPassword(req.email(), req.otp(), req.newPassword());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(CustomerAccountException.class)
    public ResponseEntity<ProfileDtos.ErrorBody> handle(CustomerAccountException e) {
        return ResponseEntity.status(e.getStatus())
                .body(new ProfileDtos.ErrorBody(e.getStatus(), e.getCode(), e.getMessage(), e.getField()));
    }
}
