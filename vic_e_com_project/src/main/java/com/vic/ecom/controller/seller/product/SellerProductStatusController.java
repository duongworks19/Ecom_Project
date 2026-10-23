package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.product.SellerProductStatusRequest;
import com.vic.ecom.services.seller.product.SellerProductStatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/products/{id}/status")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerProductStatusController {

    private final SellerProductStatusService productStatusService;

    @PatchMapping
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<String>> toggleStatus(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @PathVariable Long id,
            @RequestBody(required = false) SellerProductStatusRequest request
    ) {
        String newStatus = productStatusService.toggleProductStatus(authentication, userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái hiển thị sản phẩm thành công", newStatus));
    }
}
