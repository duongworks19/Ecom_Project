package com.vic.ecom.dto;

import com.vic.ecom.enums.ProductMediaType;

import java.util.List;

public final class ProductMediaDtos {
    private ProductMediaDtos() {}

    public record Item(Long id, String url, ProductMediaType type, Integer sortOrder) {}

    public static List<Item> fromEntities(List<com.vic.ecom.entity.ProductMedia> media) {
        return media.stream()
                .map(item -> new Item(item.getId(), item.getUrl(), item.getType(), item.getSortOrder()))
                .toList();
    }
}
