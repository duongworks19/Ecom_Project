package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.ShipperPortalDtos;
import com.vic.ecom.services.ShipperShipmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

@RestController @RequestMapping("/api/shipper/shipments") @PreAuthorize("hasRole('SHIPPER')") @RequiredArgsConstructor
public class ShipperShipmentController {
    private final ShipperShipmentService service;

    @PostMapping("/{id}/pickup")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Item>> pickup(Authentication a, @PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Đã lấy hàng", service.pickup(a, id)));
    }

    @PostMapping("/{id}/confirm-delivered")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Item>> delivered(Authentication a, @PathVariable Long id, @RequestBody(required = false) ShipperPortalDtos.DeliveredRequest r) {
        return ResponseEntity.ok(ApiResponse.ok("Đã giao hàng", service.delivered(a, id, r == null ? null : r.collectedCod())));
    }

    @PostMapping("/{id}/report-failure")
    public ResponseEntity<ApiResponse<ShipperPortalDtos.Item>> failure(Authentication a, @PathVariable Long id, @Valid @RequestBody ShipperPortalDtos.FailureReportRequest r) {
        return ResponseEntity.ok(ApiResponse.ok("Đã báo giao thất bại", service.failure(a, id, r.reason(), r.notes())));
    }
}
