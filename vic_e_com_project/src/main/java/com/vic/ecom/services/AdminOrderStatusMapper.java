package com.vic.ecom.services;

import com.vic.ecom.enums.OrderStatus;
import java.util.Map;

public final class AdminOrderStatusMapper {
    private AdminOrderStatusMapper() {}
    public record Mapped(String key, String label, boolean attention) {}
    private static final Map<OrderStatus, Mapped> MAP = Map.of(
            OrderStatus.PENDING, new Mapped("waiting_confirm", "Chờ xác nhận", true),
            OrderStatus.CONFIRMED, new Mapped("preparing", "Đã xác nhận", false),
            OrderStatus.PREPARING, new Mapped("preparing", "Đang chuẩn bị", false),
            OrderStatus.PACKED, new Mapped("preparing", "Đã đóng gói", false),
            OrderStatus.READY_TO_SHIP, new Mapped("waiting_confirm", "Chờ bàn giao", true),
            OrderStatus.SHIPPING, new Mapped("delivering", "Đang giao", false),
            OrderStatus.DELIVERED, new Mapped("delivered", "Đã giao", false),
            OrderStatus.CANCELLED, new Mapped("cancelled", "Đã hủy", false),
            OrderStatus.REJECTED, new Mapped("cancelled", "Bị từ chối", false));
    public static Mapped map(OrderStatus status) { return status == null ? new Mapped("other", "Khác", false) : MAP.getOrDefault(status, new Mapped("other", "Khác", false)); }
}
