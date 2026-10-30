package com.vic.ecom.controller;

import com.vic.ecom.dto.CheckoutDtos;
import com.vic.ecom.services.CustomerCheckoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/customer/checkout") @PreAuthorize("hasRole('CUSTOMER')") @RequiredArgsConstructor
public class CustomerCheckoutController {
    private final CustomerCheckoutService checkout;
    @PostMapping("/preview")
    public ResponseEntity<CheckoutDtos.Preview> preview(Authentication auth, @RequestBody CheckoutDtos.Request request) { return ResponseEntity.ok(checkout.preview(auth, request)); }
}
