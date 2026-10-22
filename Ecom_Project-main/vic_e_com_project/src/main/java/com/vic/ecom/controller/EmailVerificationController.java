package com.vic.ecom.controller;

import com.vic.ecom.dto.AuthOtpDtos;
import com.vic.ecom.dto.ProfileDtos;
import com.vic.ecom.services.EmailVerificationService;
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
public class EmailVerificationController {

    private final EmailVerificationService emailVerificationService;

    @PostMapping("/verify-email")
    public ResponseEntity<Void> verifyEmail(@Valid @RequestBody AuthOtpDtos.VerifyEmailRequest req) {
        emailVerificationService.verify(req.email(), req.otp());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Void> resendVerification(@Valid @RequestBody AuthOtpDtos.ResendRequest req) {
        emailVerificationService.resend(req.email());
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(CustomerAccountException.class)
    public ResponseEntity<ProfileDtos.ErrorBody> handle(CustomerAccountException e) {
        return ResponseEntity.status(e.getStatus())
                .body(new ProfileDtos.ErrorBody(e.getStatus(), e.getCode(), e.getMessage(), e.getField()));
    }
}
