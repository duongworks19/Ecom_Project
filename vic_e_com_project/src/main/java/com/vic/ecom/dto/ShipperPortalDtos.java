package com.vic.ecom.dto;

import com.vic.ecom.enums.ShipmentStatus;
import com.vic.ecom.enums.ShipperWorkStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class ShipperPortalDtos {
    private ShipperPortalDtos() { }
    public record Profile(Long id, Long userId, String fullName, String shipperCode, String email, String phone,
                          String avatarUrl, String vehicleType, String licensePlate, String hubName,
                          String serviceArea, String partnerCompany, String joinedDate, BigDecimal rating,
                          ShipperWorkStatus workStatus) { }
    public record UpdateProfile(String fullName, String phone, String vehicleType,
                                 String licensePlate, String serviceArea) { }
    public record Kpi(long readyToPickCount, long deliveringCount, long deliveredCount, long failedCount,
                      BigDecimal totalCollectedCod, Double successRate) { }
    public record Item(Long id, Long orderId, String code, Long shipperId, ShipmentStatus status,
                       BigDecimal codAmount, String vendorName, String vendorPhone, String vendorAddress,
                       String customerName, String customerPhone, String customerAddress, String itemSummary,
                       String packageWeightKg, LocalDateTime createdAt, List<Event> events, Failure failure) { }
    public record Event(Long id, Long shipmentId, ShipmentStatus eventType, LocalDateTime time,
                        String title, String notes) { }
    public record Failure(Long id, Long shipmentId, String failureReason, String notes, LocalDateTime reportedAt) { }

    // Request bodies
    public record DeliveredRequest(BigDecimal collectedCod) { }
    public record FailureReportRequest(@NotBlank String reason, String notes) { }
    public record WorkStatusRequest(@NotNull Boolean isAvailable) { }
}
