package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.CartDtos;
import com.vic.ecom.services.CartCommandService;
import com.vic.ecom.services.CartQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class CartController {
    private final CartQueryService query;
    private final CartCommandService command;

    @GetMapping public ResponseEntity<ApiResponse<CartDtos.CartResponse>> get(Authentication a) { return ResponseEntity.ok(ApiResponse.ok("Giỏ hàng", query.get(a))); }
    @GetMapping("/count") public ResponseEntity<ApiResponse<CartDtos.CountResponse>> count(Authentication a) { return ResponseEntity.ok(ApiResponse.ok("Số lượng giỏ hàng", new CartDtos.CountResponse(query.count(a)))); }
    @PostMapping("/items") public ResponseEntity<ApiResponse<CartDtos.MutationResponse>> add(Authentication a, @Valid @RequestBody CartDtos.AddRequest r) { return ResponseEntity.ok(ApiResponse.ok("Đã thêm vào giỏ hàng", command.add(a, r))); }
    @PatchMapping("/items/{id}") public ResponseEntity<ApiResponse<CartDtos.MutationResponse>> update(Authentication a, @PathVariable Long id, @Valid @RequestBody CartDtos.UpdateRequest r) { return ResponseEntity.ok(ApiResponse.ok("Đã cập nhật giỏ hàng", command.update(a, id, r))); }
    @DeleteMapping("/items/{id}") public ResponseEntity<Void> delete(Authentication a, @PathVariable Long id) { command.delete(a, id); return ResponseEntity.noContent().build(); }
    @PostMapping("/items/bulk-delete") public ResponseEntity<ApiResponse<CartDtos.RemovedResponse>> bulk(Authentication a, @Valid @RequestBody CartDtos.BulkDeleteRequest r) { return ResponseEntity.ok(ApiResponse.ok("Đã xóa sản phẩm", command.bulkDelete(a, r))); }
    @DeleteMapping("/unavailable") public ResponseEntity<ApiResponse<CartDtos.RemovedResponse>> unavailable(Authentication a) { return ResponseEntity.ok(ApiResponse.ok("Đã xóa sản phẩm không khả dụng", command.deleteUnavailable(a))); }
}
