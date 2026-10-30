package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.PublicCategoryDtos;
import com.vic.ecom.entity.Category;
import com.vic.ecom.enums.CategoryStatus;
import com.vic.ecom.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryRepository categories;

    @GetMapping
    public ResponseEntity<ApiResponse<PublicCategoryDtos.Response>> list() {
        List<PublicCategoryDtos.Item> items = categories.findAllByOrderByIdAsc().stream()
                .filter(c -> c.getStatus() == null || c.getStatus() == CategoryStatus.VISIBLE)
                .map(this::toItem)
                .toList();
        return ResponseEntity.ok(ApiResponse.ok("Danh sách danh mục", new PublicCategoryDtos.Response(items)));
    }

    private PublicCategoryDtos.Item toItem(Category category) {
        return new PublicCategoryDtos.Item(
                category.getId(),
                category.getParentId(),
                category.getName(),
                category.getSlug()
        );
    }
}
