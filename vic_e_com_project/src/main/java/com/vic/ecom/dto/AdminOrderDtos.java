package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public final class AdminOrderDtos {
    private AdminOrderDtos() {}
    public record Summary(long total, long delivering, long needsAttention, long delivered, Map<String, Long> byStatus) {}
    public record Page<T>(List<T> items, int page, int pageSize, long total, int totalPages) {}
    public record Item(Long id, String orderCode, LocalDateTime createdAt, String customerName, String recipientName, String shopName, BigDecimal total, String paymentMethod, String statusKey, String statusLabel, boolean needsAttention) {}
    public record Detail(Long id, Customer customer, Shop shop, List<OrderItem> items, Amounts amounts, List<Payment> payments, List<Shipment> shipping, List<ReturnRequest> returnRequests, List<SupportTicket> supportTickets, String cancelReason, String rejectReason, List<Timeline> timeline) {}
    public record Customer(String accountName, String recipientName, String recipientPhone, String recipientAddress) {}
    public record Shop(String name, String businessName) {}
    public record OrderItem(String productName, String variantInfo, BigDecimal unitPrice, Integer quantity) {}
    public record Amounts(BigDecimal subtotal, BigDecimal shippingFee, BigDecimal discountAmount, BigDecimal total, String voucherCode) {}
    public record Payment(String method, BigDecimal amount, String status, LocalDateTime paidAt, String collectedBy) {}
    public record Shipment(Long id, String shipperName, String status, LocalDateTime assignedAt, LocalDateTime pickedUpAt, LocalDateTime deliveredAt, BigDecimal codAmount, boolean codCollected, List<Event> events, List<Failure> failures) {}
    public record Event(String status, String note, LocalDateTime at) {}
    public record Failure(Integer attemptNo, String reason, String nextAction, LocalDateTime at) {}
    public record ReturnRequest(String type, String reason, String status, String vendorResponse, BigDecimal refundAmount, LocalDateTime createdAt, List<String> mediaUrls) {}
    public record SupportTicket(String type, String subject, String status, LocalDateTime createdAt) {}
    public record Timeline(String fromStatus, String toStatus, String fromLabel, String toLabel, String changedBy, String role, String note, LocalDateTime at) {}
}
