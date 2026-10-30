package com.vic.ecom.controller;

import com.vic.ecom.dto.AdminOrderDtos;
import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.services.AdminOrderQueryService;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/admin/orders")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminOrderController {
    private final AdminOrderQueryService query;

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<AdminOrderDtos.Summary>> summary() { return ResponseEntity.ok(ApiResponse.ok("Tổng quan đơn hàng", query.summary())); }

    @GetMapping
    public ResponseEntity<ApiResponse<AdminOrderDtos.Page<AdminOrderDtos.Item>>> list(
            @RequestParam(required = false) String q, @RequestParam(required = false) String status,
            @RequestParam(required = false) Long shopId, @RequestParam(required = false) String paymentMethod,
            @RequestParam(required = false) LocalDate from, @RequestParam(required = false) LocalDate to,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int pageSize) {
        if (page < 1 || pageSize < 1 || pageSize > 100 || shopId != null && shopId < 1 || from != null && to != null && from.isAfter(to)) throw CustomerAccountException.badRequest("INVALID_QUERY", "Tham số lọc không hợp lệ", null);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách đơn hàng", query.list(q, status, shopId, paymentMethod, from, to, page - 1, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminOrderDtos.Detail>> detail(@PathVariable Long id) {
        if (id == null || id < 1) throw CustomerAccountException.badRequest("INVALID_ID", "Mã đơn hàng không hợp lệ", "id");
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết đơn hàng", query.detail(id)));
    }
}
