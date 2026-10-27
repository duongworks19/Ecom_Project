package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.util.List;

public final class ProductVariantDtos {
    private ProductVariantDtos() {
    }

    public record Item(Long variantId, String sku, String label, BigDecimal price,
                       Integer stockQty, boolean available) {
    }

    public record Response(Long productId, List<Item> variants) {
    }
}
