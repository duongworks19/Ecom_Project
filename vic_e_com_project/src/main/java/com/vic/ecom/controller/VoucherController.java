package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.VoucherDtos;
import com.vic.ecom.services.VoucherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/vouchers")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
@CrossOrigin(origins = "*")
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<VoucherDtos.Response>>> getVouchers(
            @RequestParam(required = false) String status
    ) {
        List<VoucherDtos.Response> list = voucherService.getVouchers(status);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách voucher", list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherDtos.Response>> getVoucherById(
            @PathVariable Long id
    ) {
        VoucherDtos.Response response = voucherService.getVoucherById(id);
        return ResponseEntity.ok(ApiResponse.ok("Chi tiết voucher", response));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<VoucherDtos.Response>> createVoucher(
            @Valid @RequestBody VoucherDtos.CreateRequest request
    ) {
        VoucherDtos.Response response = voucherService.createVoucher(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo voucher thành công", response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<VoucherDtos.Response>> updateVoucher(
            @PathVariable Long id,
            @Valid @RequestBody VoucherDtos.UpdateRequest request
    ) {
        VoucherDtos.Response response = voucherService.updateVoucher(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật voucher thành công", response));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<VoucherDtos.Response>> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody VoucherDtos.StatusRequest request
    ) {
        VoucherDtos.Response response = voucherService.updateStatus(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái voucher thành công", response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteVoucher(
            @PathVariable Long id
    ) {
        voucherService.deleteVoucher(id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa voucher thành công", null));
    }
}
