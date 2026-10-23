package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.ShipperPortalDtos;
import com.vic.ecom.services.ShipperPortalQueryService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/shipper")
@PreAuthorize("hasRole('SHIPPER')")
@RequiredArgsConstructor
public class ShipperPortalController {
    private final ShipperPortalQueryService service;

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Profile>> profile(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Thông tin hồ sơ", service.profile(auth)));
    }

    @GetMapping("/dashboard/kpi")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Kpi>> kpi(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("KPI", service.kpi(auth)));
    }

    @GetMapping("/shipments")
    public ResponseEntity<ApiResponse<java.util.List<ShipperPortalDtos.Item>>> shipments(Authentication auth, @RequestParam(defaultValue = "ALL") String status) {
        return ResponseEntity.ok(ApiResponse.ok("Danh sách đơn giao", service.list(auth, status.toUpperCase())));
    }

    @GetMapping("/shipments/{id}")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Item>> shipment(Authentication auth, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết đơn giao", service.detail(auth, id)));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<java.util.List<ShipperPortalDtos.Item>>> history(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Lịch sử giao hàng", service.history(auth)));
    }

    @PutMapping("/profile/work-status")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Profile>> workStatus(Authentication auth,
            @Valid @RequestBody WorkStatus request) {
        service.setWorkStatus(auth, request.isAvailable());
        return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật trạng thái", service.profile(auth)));
    }

    public record WorkStatus(@NotNull Boolean isAvailable) { }
}
