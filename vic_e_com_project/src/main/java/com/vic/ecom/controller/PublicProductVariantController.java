package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.ProductVariantDtos;
import com.vic.ecom.services.PublicProductVariantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class PublicProductVariantController {
    private final PublicProductVariantService service;

    @GetMapping("/{productId}/variants")
    public ResponseEntity<ApiResponse<ProductVariantDtos.Response>> list(@PathVariable Long productId) {
        return ResponseEntity.ok(ApiResponse.ok("Danh sách biến thể sản phẩm", service.list(productId)));
    }
}
