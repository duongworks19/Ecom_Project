package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.util.List;

public final class WishlistDtos {
    private WishlistDtos() {}

    public record Item(Long productId, String name, String imageUrl, BigDecimal minPrice,
                       boolean hasMultipleVariants, BigDecimal ratingAvg, Integer soldCount,
                       boolean available, Long defaultVariantId) {}
    public record PageResponse(List<Item> content, int page, int size, long totalElements) {}
    public record IdsResponse(List<Long> productIds) {}
}
