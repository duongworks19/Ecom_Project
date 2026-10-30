package com.vic.ecom.services;

import com.vic.ecom.dto.AdminOrderDtos;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service @RequiredArgsConstructor
public class AdminOrderQueryService {
    private final OrderRepository orders; private final PaymentRepository payments; private final ShipmentRepository shipments;
    private final ShipmentEventRepository events; private final DeliveryFailureRepository failures;
    private final OrderStatusHistoryRepository histories; private final ReturnRequestRepository returns;
    private final ReturnMediaRepository returnMedia; private final SupportTicketRepository tickets;
    private final ShopRepository shops;

    @Transactional(readOnly = true)
    public AdminOrderDtos.Summary summary() {
        Map<String, Long> by = new HashMap<>();
        orders.countGroupByStatus().forEach(row -> by.merge(AdminOrderStatusMapper.map((OrderStatus) row[0]).key(), ((Number) row[1]).longValue(), Long::sum));
        for (String key : List.of("waiting_confirm", "preparing", "delivering", "delivered", "delivery_failed", "cancelled", "return_refund")) by.putIfAbsent(key, 0L);
        long failed = shipments.countByStatusIn(List.of(com.vic.ecom.enums.ShipmentStatus.FAILED));
        long waitingOld = orders.countByStatusAndCreatedAtBefore(OrderStatus.PENDING, LocalDateTime.now().minusHours(24));
        long pendingReturns = returns.countByStatus(com.vic.ecom.enums.ReturnRequestStatus.PENDING);
        by.put("delivery_failed", failed);
        by.put("return_refund", pendingReturns);
        return new AdminOrderDtos.Summary(orders.count(), by.getOrDefault("delivering", 0L), failed + waitingOld + pendingReturns, by.getOrDefault("delivered", 0L), by);
    }

    @Transactional(readOnly = true)
    public AdminOrderDtos.Page<AdminOrderDtos.Item> list(String q, String status, Long shopId, String paymentMethod, LocalDate from, LocalDate to, int page, int pageSize) {
        com.vic.ecom.enums.PaymentMethod method = paymentMethod == null || paymentMethod.isBlank() ? null : parsePaymentMethod(paymentMethod);
        // ponytail: PostgreSQL timestamp không nhận LocalDateTime.MIN/MAX; các mốc này bao phủ vòng đời dữ liệu thực tế.
        var resultPage = orders.search(q == null || q.isBlank() ? "" : q.trim().toLowerCase(Locale.ROOT), shopId == null ? 0L : shopId, method, from == null ? LocalDateTime.of(1970, 1, 1, 0, 0) : from.atStartOfDay(), to == null ? LocalDateTime.of(9999, 12, 31, 0, 0) : to.plusDays(1).atStartOfDay(), blankToNull(status), statuses(status), PageRequest.of(page, pageSize, Sort.by(Sort.Direction.DESC, "createdAt", "id")));
        var result = resultPage.getContent().stream().map(this::item).toList();
        return new AdminOrderDtos.Page<>(result, page, pageSize, resultPage.getTotalElements(), resultPage.getTotalPages());
    }

    private com.vic.ecom.enums.PaymentMethod parsePaymentMethod(String value) { try { return com.vic.ecom.enums.PaymentMethod.valueOf(value.toUpperCase(Locale.ROOT)); } catch (IllegalArgumentException e) { throw com.vic.ecom.ultis.CustomerAccountException.badRequest("INVALID_PAYMENT_METHOD", "Phương thức thanh toán không hợp lệ", "paymentMethod"); } }
    private String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim().toLowerCase(Locale.ROOT); }

    private Collection<OrderStatus> statuses(String chip) {
        if (chip == null || chip.isBlank()) return EnumSet.allOf(OrderStatus.class);
        return switch (chip) {
            case "waiting_confirm" -> List.of(OrderStatus.PENDING, OrderStatus.READY_TO_SHIP);
            case "preparing" -> List.of(OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.PACKED);
            case "delivering" -> List.of(OrderStatus.SHIPPING);
            case "delivered" -> List.of(OrderStatus.DELIVERED);
            case "cancelled" -> List.of(OrderStatus.CANCELLED, OrderStatus.REJECTED);
            case "delivery_failed", "return_refund" -> EnumSet.allOf(OrderStatus.class);
            default -> throw com.vic.ecom.ultis.CustomerAccountException.badRequest("INVALID_STATUS", "Trạng thái không hợp lệ", "status");
        };
    }

    private boolean matches(Order o, String q) {
        if (q == null || q.isBlank()) return true;
        String needle = q.toLowerCase(Locale.ROOT);
        return contains(o.getOrderCode(), needle) || contains(o.getReceiverName(), needle) || contains(o.getReceiverPhone(), needle) || contains(o.getCustomer() == null ? null : o.getCustomer().getFullName(), needle);
    }
    private boolean contains(String value, String needle) { return value != null && value.toLowerCase(Locale.ROOT).contains(needle); }

    private AdminOrderDtos.Item item(Order o) {
        var mapped = AdminOrderStatusMapper.map(o.getStatus());
        String payment = payments.findByOrder_IdOrderByPaidAtDescIdDesc(o.getId()).stream().findFirst().map(p -> p.getMethod().name()).orElse(null);
        return new AdminOrderDtos.Item(o.getId(), o.getOrderCode(), o.getCreatedAt(), o.getCustomer() == null ? null : o.getCustomer().getFullName(), o.getReceiverName(), shopName(o.getShopId()), o.getTotalAmount(), payment, mapped.key(), mapped.label(), mapped.attention());
    }
    private String shopName(Long id) { return id == null ? null : shops.findById(id).map(Shop::getName).orElse(null); }

    @Transactional(readOnly = true)
    public AdminOrderDtos.Detail detail(Long id) {
        Order o = orders.findById(id).orElseThrow(() -> com.vic.ecom.ultis.CustomerAccountException.notFound("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng"));
        return new AdminOrderDtos.Detail(id, new AdminOrderDtos.Customer(o.getCustomer() == null ? null : o.getCustomer().getFullName(), o.getReceiverName(), mask(o.getReceiverPhone()), o.getShippingAddress()), new AdminOrderDtos.Shop(shopName(o.getShopId()), null), o.getItems().stream().map(i -> new AdminOrderDtos.OrderItem(i.getProductName(), i.getVariantId() == null ? null : "Variant #" + i.getVariantId(), i.getUnitPrice(), i.getQuantity())).toList(), new AdminOrderDtos.Amounts(o.getSubtotal(), o.getShippingFee(), o.getDiscountAmount(), o.getTotalAmount(), null), payments.findByOrder_IdOrderByPaidAtDescIdDesc(id).stream().map(this::payment).toList(), shipments.findByOrder_IdOrderByAssignedAtDesc(id).stream().map(this::shipment).toList(), returns.findByOrder_IdOrderByCreatedAtDesc(id).stream().map(this::returnRequest).toList(), tickets.findByOrder_IdOrderByCreatedAtDesc(id).stream().map(t -> new AdminOrderDtos.SupportTicket(t.getType(), t.getSubject(), t.getStatus(), t.getCreatedAt())).toList(), o.getReason(), o.getRejectReason(), timeline(o));
    }
    private String mask(String s) { return s == null || s.length() < 7 ? s : s.substring(0, 2) + "•• ••• " + s.substring(s.length() - 3); }
    private AdminOrderDtos.Payment payment(Payment p) { return new AdminOrderDtos.Payment(p.getMethod().name(), p.getAmount(), p.getStatus(), p.getPaidAt(), p.getCollectedBy() == null ? null : p.getCollectedBy().getFullName()); }
    private AdminOrderDtos.Shipment shipment(Shipment s) { return new AdminOrderDtos.Shipment(s.getId(), s.getShipper() == null || s.getShipper().getUser() == null ? null : s.getShipper().getUser().getFullName(), s.getStatus().name(), s.getAssignedAt(), s.getPickedUpAt(), s.getDeliveredAt(), s.getCodAmount(), s.isCodCollected(), events.findByShipment_IdOrderByCreatedAtAsc(s.getId()).stream().map(e -> new AdminOrderDtos.Event(e.getStatus().name(), e.getNote(), e.getCreatedAt())).toList(), failures.findByShipment_IdOrderByCreatedAtAsc(s.getId()).stream().map(f -> new AdminOrderDtos.Failure(f.getAttemptNo(), f.getReason(), f.getNextAction(), f.getCreatedAt())).toList()); }
    private AdminOrderDtos.ReturnRequest returnRequest(ReturnRequest r) { return new AdminOrderDtos.ReturnRequest(r.getType().name(), r.getReason(), r.getStatus().name(), r.getVendorResponse(), r.getRefundAmount(), r.getCreatedAt(), returnMedia.findByRequest_IdOrderByIdAsc(r.getId()).stream().map(ReturnMedia::getUrl).toList()); }
    private List<AdminOrderDtos.Timeline> timeline(Order o) {
        var history = histories.findByOrderIdOrderByChangedAtDesc(o.getId());
        if (!history.isEmpty()) return history.stream().sorted(Comparator.comparing(OrderStatusHistory::getChangedAt)).map(h -> {
            var f = AdminOrderStatusMapper.map(h.getFromStatus());
            var t = AdminOrderStatusMapper.map(h.getToStatus());
            return new AdminOrderDtos.Timeline(h.getFromStatus() == null ? null : h.getFromStatus().name(), h.getToStatus() == null ? null : h.getToStatus().name(), f.label(), t.label(), h.getChangedBy() == null ? null : "User #" + h.getChangedBy(), null, h.getNote(), h.getChangedAt());
        }).toList();
        var fallback = new ArrayList<AdminOrderDtos.Timeline>();
        fallback.add(new AdminOrderDtos.Timeline(null, o.getStatus() == null ? null : o.getStatus().name(), "", AdminOrderStatusMapper.map(o.getStatus()).label(), null, null, "Khách đặt hàng", o.getCreatedAt()));
        for (Shipment s : shipments.findByOrder_IdOrderByAssignedAtDesc(o.getId())) {
            fallback.add(new AdminOrderDtos.Timeline(null, s.getStatus() == null ? null : s.getStatus().name(), "", s.getStatus() == null ? "" : s.getStatus().name(), null, null, "Vận chuyển", s.getAssignedAt()));
            if (s.getPickedUpAt() != null) fallback.add(new AdminOrderDtos.Timeline(null, "PICKED_UP", "", "Đã lấy hàng", null, null, null, s.getPickedUpAt()));
            if (s.getDeliveredAt() != null) fallback.add(new AdminOrderDtos.Timeline(null, "DELIVERED", "", "Đã giao", null, null, null, s.getDeliveredAt()));
        }
        return fallback.stream().sorted(Comparator.comparing(AdminOrderDtos.Timeline::at, Comparator.nullsLast(Comparator.naturalOrder()))).toList();
    }
}
