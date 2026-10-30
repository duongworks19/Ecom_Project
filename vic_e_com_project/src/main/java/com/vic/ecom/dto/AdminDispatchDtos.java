package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public final class AdminDispatchDtos {
    private AdminDispatchDtos() { }
    public record Counts(long waiting, long delivering, long failed, long delivered) { }
    public record Shipper(Long id, String fullName, String workStatus, long activeOrders, int maxActiveOrders) { }
    public record Summary(Counts counts, boolean running, LocalDateTime lastScanAt, List<Shipper> shippers) { }
    public record Item(Long orderId, String orderCode, String district, String shopName,
                       String receiverName, String receiverPhone, BigDecimal codAmount,
                       String displayStatus, String orderStatus, String shipperName,
                       int attemptNo, String waitingNote) { }
    public record Page<T>(List<T> content, int page, int size, long totalElements) { }
    public record Event(String status, String note, LocalDateTime createdAt) { }
    public record Detail(Long orderId, String orderCode, String trackingCode, String route,
                         String displayStatus, Item item, List<Event> events) { }
    public record FailureResolution(String action, String note) { }
    public record ManualAssign(Long shipperId) { }
}
