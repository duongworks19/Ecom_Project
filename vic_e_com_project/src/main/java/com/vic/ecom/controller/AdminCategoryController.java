package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.AdminCategoryDtos.*;
import com.vic.ecom.enums.CategoryStatus;
import com.vic.ecom.services.AdminCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCategoryController {

    private final AdminCategoryService service;

    @GetMapping
    public ResponseEntity<ApiResponse<CategoryOverviewResponse>> list(@RequestParam(required=false) String keyword, @RequestParam(required=false) CategoryStatus status) {
        return ResponseEntity.ok(ApiResponse.ok("Danh sách danh mục", service.list(keyword,status)));
    }

    @GetMapping("/check-slug")
    public ResponseEntity<ApiResponse<SlugCheckResponse>> check(@RequestParam String slug, @RequestParam(required=false) Long excludeId) {
        return ResponseEntity.ok(ApiResponse.ok("Kiểm tra slug", service.checkSlug(slug,excludeId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CategoryItem>> create(@RequestBody UpsertCategoryRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Tạo danh mục thành công",service.create(req)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryItem>>    update(@PathVariable Long id,@RequestBody UpsertCategoryRequest req) {
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật danh mục thành công",service.update(id,req)));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<StatusChangeResponse>> status(@PathVariable Long id,@RequestBody ChangeStatusRequest req) {
        if (req == null || req.status() == null) throw com.vic.ecom.ultis.CustomerAccountException.badRequest("INVALID_STATUS", "Trạng thái bắt buộc", "status");
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật trạng thái thành công",service.changeStatus(id,req.status())));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
