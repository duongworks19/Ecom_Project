package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.product.SellerProductCreateRequest;
import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.services.seller.product.SellerProductCreateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/products/create")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerProductCreateController {

    private final SellerProductCreateService productCreateService;

    @PostMapping
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SellerProductDetailDto>> createProduct(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @Valid @RequestBody SellerProductCreateRequest request
    ) {
        SellerProductDetailDto result = productCreateService.createProduct(authentication, userId, request);
        return ResponseEntity.ok(ApiResponse.ok("Thêm sản phẩm mới thành công", result));
    }
}
