package com.vic.ecom.controller;

import com.vic.ecom.dto.AdminDispatchDtos;
import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.services.AdminDispatchQueryService;
import com.vic.ecom.services.AdminDispatchCommandService;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/dispatch")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDispatchController {
    private final AdminDispatchQueryService query;
    private final AdminDispatchCommandService command;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminDispatchDtos.Summary>> summary() {
        return ResponseEntity.ok(ApiResponse.ok("Tổng quan điều phối", query.summary()));
    }

    @GetMapping("/items")
    public ResponseEntity<ApiResponse<AdminDispatchDtos.Page<AdminDispatchDtos.Item>>> items(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        List<String> allowed = List.of("WAITING", "DELIVERING", "FAILED", "DELIVERED");
        if (page < 0 || size < 1 || size > 100 || (status != null && !status.isBlank() && !allowed.contains(status))) {
            throw CustomerAccountException.badRequest("INVALID_QUERY", "Tham số lọc không hợp lệ", null);
        }
        return ResponseEntity.ok(ApiResponse.ok("Danh sách điều phối", query.items(status, page, size)));
    }

    @GetMapping("/items/{orderId}")
    public ResponseEntity<ApiResponse<AdminDispatchDtos.Detail>> detail(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết điều phối", query.detail(orderId)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/items/{orderId}/failure-resolution")
    public ResponseEntity<ApiResponse<AdminDispatchDtos.Detail>> resolve(
            @PathVariable Long orderId,
            @org.springframework.web.bind.annotation.RequestBody AdminDispatchDtos.FailureResolution request) {
        return ResponseEntity.ok(ApiResponse.ok("Đã xử lý giao thất bại", command.resolve(orderId, request)));
    }

    @org.springframework.web.bind.annotation.PostMapping("/items/{orderId}/manual-assign")
    public ResponseEntity<ApiResponse<AdminDispatchDtos.Detail>> manualAssign(
            @PathVariable Long orderId,
            @org.springframework.web.bind.annotation.RequestBody AdminDispatchDtos.ManualAssign request) {
        return ResponseEntity.ok(ApiResponse.ok("Đã gán shipper", command.manualAssign(orderId, request)));
    }
}
