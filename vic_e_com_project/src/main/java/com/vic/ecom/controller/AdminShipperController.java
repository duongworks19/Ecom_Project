package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.AdminShipperDtos.*;
import com.vic.ecom.entity.ShipperProfile;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.repository.ShipperProfileRepository;
import com.vic.ecom.services.AdminShipperQueryService;
import com.vic.ecom.services.AdminShipperService;
import com.vic.ecom.ultis.CustomerAccountException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/shippers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminShipperController {
    private final AdminShipperQueryService query; private final AdminShipperService service; private final ShipperProfileRepository profiles;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ListItem>>> list(@RequestParam(defaultValue = "") String keyword, @RequestParam(defaultValue = "ALL") String status, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "8") int size) {
        if (page < 0 || size < 1 || size > 50 || !java.util.List.of("ALL", "AVAILABLE", "BUSY", "OFFLINE", "LOCKED").contains(status.toUpperCase())) throw CustomerAccountException.badRequest("INVALID_QUERY", "Tham số lọc không hợp lệ", "status");
        return ResponseEntity.ok(ApiResponse.ok("Danh sách shipper", query.list(keyword, status.toUpperCase(), page, size)));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Summary>> summary() {
        return ResponseEntity.ok(ApiResponse.ok("Tổng quan shipper", query.summary()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Detail>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết shipper", query.detail(require(id), null)));
    }

    @GetMapping("/{id}/deliveries")
    public ResponseEntity<ApiResponse<Page<Delivery>>> deliveries(@PathVariable Long id, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) { if (page < 0 || size < 1 || size > 50) throw CustomerAccountException.badRequest("INVALID_QUERY", "Tham số phân trang không hợp lệ", null);
        return ResponseEntity.ok(ApiResponse.ok("Lịch sử giao hàng", query.deliveries(id, page, size)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Detail>> create(@Valid @RequestBody Create req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tạo tài khoản shipper thành công", service.create(req))); }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Detail>> update(@PathVariable Long id, @Valid @RequestBody Update req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật shipper thành công", service.update(id, req)));
    }

    @PostMapping("/{id}/lock")
    public ResponseEntity<ApiResponse<Status>> lock(@PathVariable Long id, @RequestBody(required = false) Lock req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Đã khóa shipper", service.lock(id, req == null ? null : req.reason(), auth.getName())));
    }

    @PostMapping("/{id}/unlock")
    public ResponseEntity<ApiResponse<Status>> unlock(@PathVariable Long id, @RequestBody(required = false) Lock req, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok("Đã mở khóa shipper", service.unlock(id, req == null ? null : req.reason(), auth.getName())));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<Void>> permanentlyDelete(@PathVariable Long id) {
        service.permanentlyDelete(id);
        return ResponseEntity.ok(ApiResponse.ok("Đã xóa vĩnh viễn tài khoản shipper", null));
    }

    private ShipperProfile require(Long id) {
        return profiles.findByUserId(id).filter(p -> p.getUser().getRole() == UserRole.SHIPPER).orElseThrow(()
                -> CustomerAccountException.notFound("SHIPPER_NOT_FOUND", "Không tìm thấy shipper"));
    }
}
