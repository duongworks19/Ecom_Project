package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.dto.seller.product.SellerProductUpdateRequest;
import com.vic.ecom.services.seller.product.SellerProductUpdateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/products/{id}/update")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerProductUpdateController {

    private final SellerProductUpdateService productUpdateService;

    @PutMapping
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SellerProductDetailDto>> updateProduct(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @PathVariable Long id,
            @Valid @RequestBody SellerProductUpdateRequest request
    ) {
        SellerProductDetailDto result = productUpdateService.updateProduct(authentication, userId, id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin sản phẩm thành công", result));
    }
}
