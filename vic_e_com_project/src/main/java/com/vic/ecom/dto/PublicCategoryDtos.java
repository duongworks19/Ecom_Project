package com.vic.ecom.dto;

import java.util.List;

public final class PublicCategoryDtos {
    private PublicCategoryDtos() {
    }

    public record Item(Long id, Long parentId, String name, String slug) {
    }

    public record Response(List<Item> items) {
    }
}
