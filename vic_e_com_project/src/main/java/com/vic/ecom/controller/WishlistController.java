package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.WishlistDtos;
import com.vic.ecom.services.WishlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishlist")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class WishlistController {
    private final WishlistService service;

    @GetMapping public ResponseEntity<ApiResponse<WishlistDtos.PageResponse>> list(Authentication a, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return ResponseEntity.ok(ApiResponse.ok("Danh sách yêu thích", service.list(a, page, size))); }
    @GetMapping("/ids") public ResponseEntity<ApiResponse<WishlistDtos.IdsResponse>> ids(Authentication a) { return ResponseEntity.ok(ApiResponse.ok("Sản phẩm yêu thích", service.ids(a))); }
    @PutMapping("/{productId}") public ResponseEntity<Void> add(Authentication a, @PathVariable Long productId) { service.add(a, productId); return ResponseEntity.noContent().build(); }
    @DeleteMapping("/{productId}") public ResponseEntity<Void> remove(Authentication a, @PathVariable Long productId) { service.remove(a, productId); return ResponseEntity.noContent().build(); }
}
