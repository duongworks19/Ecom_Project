package com.vic.ecom.dto;

import com.vic.ecom.enums.ShipperWorkStatus;
import com.vic.ecom.enums.ShipmentStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminShipperDtos {
    private AdminShipperDtos() { }
    public record Page<T>(List<T> items, int page, int size, long totalElements, int totalPages, long total) { }
    public record Create(String fullName, String phone, String email, String vehicleType, String licensePlate,
                         String serviceArea, Boolean sendTempPasswordByEmail) { }
    public record Update(String fullName, String phone, String vehicleType, String licensePlate,
                         String serviceArea, String workStatus) { }
    public record Lock(String reason) { }
    public record ListItem(Long id, String fullName, String phone, ShipperWorkStatus workStatus,
                           String accountStatus, long deliveringCount, String serviceArea) { }
    public record Summary(long total, long available, long busy, long locked, long deliveringOrders) { }
    public record Performance(long deliveredCount, long failedCount, Double successRate) { }
    public record Recent(String orderCode, ShipmentStatus status, LocalDateTime time) { }
    public record Detail(Long id, String fullName, String email, String phone, String avatarUrl,
                         String accountStatus, ShipperWorkStatus workStatus, String vehicleType,
                         String licensePlate, String serviceArea, LocalDateTime createdAt,
                         long deliveringCount, Performance performance, List<Recent> recentDeliveries,
                         String temporaryPassword) { }
    public record Delivery(Long shipmentId, String orderCode, ShipmentStatus status, BigDecimal codAmount,
                           boolean codCollected, LocalDateTime assignedAt, LocalDateTime deliveredAt) { }
    public record Status(Long id, String accountStatus) { }
}
