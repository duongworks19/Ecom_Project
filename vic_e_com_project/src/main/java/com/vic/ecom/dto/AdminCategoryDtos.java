package com.vic.ecom.dto;

import com.vic.ecom.enums.CategoryStatus;
import jakarta.validation.constraints.*;
import java.util.List;

public final class AdminCategoryDtos {
    private AdminCategoryDtos() {}
    public record UpsertCategoryRequest(@NotBlank @Size(max=100) String name, Long parentId, String slug, CategoryStatus status) {}
    public record ChangeStatusRequest(@NotNull CategoryStatus status) {}
    public record Summary(long totalCategories, long visibleCategories, long hiddenCategories) {}
    public record CategoryItem(Long id, Long parentId, String name, String slug, CategoryStatus status, int level, List<String> pathNames, long directProductCount, long totalProductCount, long childCount) {}
    public record CategoryOverviewResponse(Summary summary, int maxDepth, List<CategoryItem> items) {}
    public record SlugCheckResponse(String slug, boolean available, String suggestedSlug) {}
    public record StatusChangeResponse(List<Long> affectedIds, int affectedCount) {}
}
