package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.util.List;

public final class CheckoutDtos {
    private CheckoutDtos() {}
    public record VoucherInput(Long shopId, String code) {}
    public record Request(List<Long> cartItemIds, Long addressId, List<VoucherInput> vouchers, String paymentMethod) {}
    public record Preview(List<ShopPreview> shops, BigDecimal grandTotal) {}
    public record ShopPreview(Long shopId, String shopName, List<Item> items, BigDecimal subtotal, BigDecimal shippingFee, String voucherCode, BigDecimal discountAmount, BigDecimal total) {}
    public record Item(Long cartItemId, Long variantId, String productName, String variantInfo, String thumbnailUrl, BigDecimal unitPrice, BigDecimal originalPrice, int quantity, BigDecimal lineTotal) {}
    public record Placed(Long checkoutGroupId, List<Order> orders, BigDecimal grandTotal) {}
    public record Order(Long id, String orderCode, String shopName, BigDecimal total) {}
}
