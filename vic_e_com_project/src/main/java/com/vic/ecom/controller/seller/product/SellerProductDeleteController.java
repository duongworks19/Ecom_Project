package com.vic.ecom.controller.seller.product;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.services.seller.product.SellerProductDeleteService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/products/{id}/delete")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerProductDeleteController {

    private final SellerProductDeleteService productDeleteService;

    @DeleteMapping
    @PreAuthorize("hasRole('VENDOR') or hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteProduct(
            Authentication authentication,
            @RequestParam(required = false) Long userId,
            @PathVariable Long id
    ) {
        productDeleteService.deleteProduct(authentication, userId, id);
        return ResponseEntity.ok(ApiResponse.ok("Xóa sản phẩm thành công", null));
    }
}
