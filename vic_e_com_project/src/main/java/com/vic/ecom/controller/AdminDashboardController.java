package com.vic.ecom.controller;

import com.vic.ecom.dto.AdminDashboardResponse;
import com.vic.ecom.services.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping("/dashboard")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> getDashboard(
            @RequestParam(name = "limit", defaultValue = "10") Integer limit) {
        return ResponseEntity.ok(adminDashboardService.getDashboard(limit));
    }
}
