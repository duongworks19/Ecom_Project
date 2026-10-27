package com.vic.ecom.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;

public final class CartDtos {
    private CartDtos() {}

    public record AddRequest(@NotNull Long variantId, @NotNull @Min(1) @Max(99) Integer quantity) {}
    public record UpdateRequest(@Min(1) @Max(99) Integer quantity, Long variantId) {}
    public record BulkDeleteRequest(@NotNull List<Long> itemIds) {}
    public record Item(Long itemId, Long productId, String productName, String imageUrl,
                       Long variantId, String variantLabel, BigDecimal unitPrice,
                       Integer quantity, Integer stockQty, Boolean lowStock, String reason) {}
    public record ShopGroup(Long shopId, String shopName, List<Item> items) {}
    public record CartResponse(List<ShopGroup> shops, List<Item> unavailableItems, int itemCount) {}
    public record CountResponse(int count) {}
    public record MutationResponse(Long itemId, Long variantId, Integer quantity) {}
    public record RemovedResponse(int removed) {}
}
