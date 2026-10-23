package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.product.SellerProductDetailDto;
import com.vic.ecom.services.seller.product.SellerProductListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerProductListController {

    private final SellerProductListService productListService;

    @GetMapping
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<SellerProductDetailDto>>> getProducts(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q
    ) {
        List<SellerProductDetailDto> list = productListService.listProducts(authentication, userId, status, q);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách sản phẩm thành công", list));
    }
}
