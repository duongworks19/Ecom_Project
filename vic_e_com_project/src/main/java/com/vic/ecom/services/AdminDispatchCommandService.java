package com.vic.ecom.services;

import com.vic.ecom.dto.AdminDispatchDtos;
import com.vic.ecom.entity.DeliveryFailure;
import com.vic.ecom.entity.InventoryLog;
import com.vic.ecom.entity.Order;
import com.vic.ecom.entity.Shipment;
import com.vic.ecom.entity.ShipmentEvent;
import com.vic.ecom.entity.ShipperProfile;
import com.vic.ecom.enums.InventoryLogReason;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.enums.ShipmentStatus;
import com.vic.ecom.enums.ShipperWorkStatus;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.DeliveryFailureRepository;
import com.vic.ecom.repository.InventoryLogRepository;
import com.vic.ecom.repository.OrderRepository;
import com.vic.ecom.repository.OrderStatusHistoryRepository;
import com.vic.ecom.repository.PaymentRepository;
import com.vic.ecom.repository.ShipmentEventRepository;
import com.vic.ecom.repository.ShipmentRepository;
import com.vic.ecom.repository.ShipperProfileRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminDispatchCommandService {
    private final OrderRepository orders;
    private final ShipmentRepository shipments;
    private final ShipperProfileRepository shippers;
    private final DeliveryFailureRepository failures;
    private final ShipmentEventRepository events;
    private final InventoryLogRepository inventory;
    private final PaymentRepository payments;
    private final OrderStatusHistoryRepository history;
    private final DispatchService dispatch;
    private final AdminDispatchQueryService query;

    @Value("${dispatch.max-attempts:3}")
    private int maxAttempts;

    @Value("${dispatch.max-active-per-shipper:2}")
    private int maxActive;

    @Transactional
    public AdminDispatchDtos.Detail resolve(Long orderId, AdminDispatchDtos.FailureResolution request) {
        String action = request == null || request.action() == null ? "" : request.action().trim().toUpperCase();
        if (!Set.of("RETRY", "REASSIGN", "RETURN").contains(action)) {
            throw CustomerAccountException.badRequest("INVALID_ACTION", "Hành động xử lý không hợp lệ", "action");
        }
        Order order = order(orderId);
        Shipment shipment = shipments.findByOrder_Id(orderId).orElseThrow(() ->
                CustomerAccountException.conflict("SHIPMENT_NOT_FOUND", "Đơn chưa có shipment thất bại", null));
        if (shipment.getStatus() != ShipmentStatus.FAILED) {
            throw CustomerAccountException.conflict("INVALID_STATE", "Đơn không ở trạng thái giao thất bại", null);
        }
        int attempt = (int) failures.countByShipment_Order_Id(orderId);
        DeliveryFailure failure = failures.findTopByShipment_IdOrderByCreatedAtDesc(shipment.getId()).orElseThrow();
        failure.setNextAction(action);
        failures.save(failure);
        event(shipment, shipment.getStatus(), adminNote(action, request.note()));

        if (attempt >= maxAttempts && !action.equals("RETURN")) {
            throw CustomerAccountException.unprocessable("MAX_ATTEMPTS", "Đơn đã đạt số lần giao tối đa", "action");
        }
        if (action.equals("RETRY")) {
            shipment.setStatus(ShipmentStatus.DELIVERING);
            shipments.save(shipment);
        } else if (action.equals("REASSIGN")) {
            dispatch.reassign(order, Set.of(shipment.getShipper().getId()));
        } else {
            OrderStatus from = order.getStatus();
            order.setStatus(OrderStatus.CANCELLED);
            order.setReason("RETURN");
            var statusHistory = new com.vic.ecom.entity.OrderStatusHistory();
            statusHistory.setOrderId(orderId);
            statusHistory.setFromStatus(from);
            statusHistory.setToStatus(OrderStatus.CANCELLED);
            statusHistory.setNote("Admin chọn RETURN");
            history.save(statusHistory);
            inventory.findByOrderIdOrderByIdAsc(orderId);
            for (var item : order.getItems()) {
                InventoryLog log = new InventoryLog();
                log.setOrderId(orderId);
                log.setVariantId(item.getVariantId());
                log.setChangeQty(item.getQuantity());
                log.setReason(InventoryLogReason.RETURN);
                inventory.save(log);
            }
            payments.findByOrderOrderByPaidAtDescIdDesc(order).stream().findFirst().ifPresent(p -> payments.save(p));
        }
        return query.detail(orderId);
    }

    @Transactional
    public AdminDispatchDtos.Detail manualAssign(Long orderId, AdminDispatchDtos.ManualAssign request) {
        if (request == null || request.shipperId() == null) {
            throw CustomerAccountException.badRequest("INVALID_REQUEST", "Thiếu shipperId", "shipperId");
        }
        Order order = order(orderId);
        if (order.getStatus() != OrderStatus.READY_TO_SHIP) {
            throw CustomerAccountException.conflict("INVALID_STATE", "Đơn chưa sẵn sàng giao", null);
        }
        if (shipments.existsByOrder_Id(orderId)) {
            throw CustomerAccountException.conflict("SHIPMENT_EXISTS", "Đơn đã có shipment", null);
        }
        ShipperProfile shipper = shippers.findById(request.shipperId()).filter(p ->
                p.getUser().getStatus() == UserStatus.ACTIVE && p.getWorkStatus() == ShipperWorkStatus.AVAILABLE).orElseThrow(() ->
                CustomerAccountException.unprocessable("SHIPPER_UNAVAILABLE", "Shipper không khả dụng", "shipperId"));
        if (shipments.countByShipper_IdAndStatusIn(shipper.getId(), List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING)) >= maxActive) {
            throw CustomerAccountException.unprocessable("SHIPPER_BUSY", "Shipper đã đạt giới hạn đơn đang giao", "shipperId");
        }
        dispatch.assignManually(order, shipper, "Admin gán thủ công");
        return query.detail(orderId);
    }

    private Order order(Long id) {
        return orders.findById(id).orElseThrow(() -> CustomerAccountException.notFound("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng"));
    }

    private String adminNote(String action, String note) {
        String value = note == null || note.isBlank() ? "" : ": " + note.trim();
        return ("Admin chọn " + action + value).substring(0, Math.min(500, ("Admin chọn " + action + value).length()));
    }

    private void event(Shipment shipment, ShipmentStatus status, String note) {
        ShipmentEvent event = new ShipmentEvent();
        event.setShipment(shipment);
        event.setStatus(status);
        event.setNote(note);
        event.setCreatedAt(LocalDateTime.now());
        events.save(event);
    }
}
