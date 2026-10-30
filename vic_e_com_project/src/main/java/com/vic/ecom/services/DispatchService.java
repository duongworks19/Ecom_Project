package com.vic.ecom.services;

import com.vic.ecom.entity.Order;
import com.vic.ecom.entity.OrderStatusHistory;
import com.vic.ecom.entity.Shipment;
import com.vic.ecom.entity.ShipmentEvent;
import com.vic.ecom.entity.ShipperProfile;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.enums.ShipmentStatus;
import com.vic.ecom.enums.ShipperWorkStatus;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.OrderRepository;
import com.vic.ecom.repository.OrderStatusHistoryRepository;
import com.vic.ecom.repository.ShipmentEventRepository;
import com.vic.ecom.repository.ShipmentRepository;
import com.vic.ecom.repository.ShipperProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DispatchService {
    private static final List<ShipmentStatus> ACTIVE = List.of(
            ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING);

    private final OrderRepository orders;
    private final ShipmentRepository shipments;
    private final ShipperProfileRepository shippers;
    private final ShipmentEventRepository events;
    private final OrderStatusHistoryRepository history;

    @Value("${dispatch.max-active-per-shipper:2}")
    private int maxActive;

    @Scheduled(fixedDelayString = "${dispatch.scan-interval-ms:30000}")
    @Transactional
    public void scheduledDispatch() {
        dispatchPendingOrders();
    }

    @Transactional
    public int dispatchPendingOrders() {
        int assigned = 0;
        for (Order order : orders.findReadyWithoutShipment(OrderStatus.READY_TO_SHIP)) {
            if (shipments.existsByOrder_Id(order.getId())) {
                continue;
            }
            ShipperProfile shipper = chooseShipper(order);
            if (shipper == null) {
                continue;
            }
            assign(order, shipper);
            assigned++;
        }
        return assigned;
    }

    private ShipperProfile chooseShipper(Order order) {
        return shippers.findByUser_StatusAndWorkStatus(UserStatus.ACTIVE, ShipperWorkStatus.AVAILABLE)
                .stream()
                .map(p -> new Candidate(p, shipments.countByShipper_IdAndStatusIn(p.getId(), ACTIVE), matchesArea(p, order)))
                .filter(c -> c.active < maxActive)
                .min(Comparator.comparing((Candidate c) -> !c.areaMatch)
                        .thenComparingLong(c -> c.active)
                        .thenComparing(c -> c.profile.getId()))
                .map(c -> c.profile)
                .orElse(null);
    }

    private void assign(Order order, ShipperProfile shipper) {
        Shipment shipment = new Shipment();
        shipment.setOrder(order);
        shipment.setShipper(shipper);
        shipment.setStatus(ShipmentStatus.ASSIGNED);
        shipment.setCodAmount(order.getTotalAmount());
        shipment.setAssignedAt(LocalDateTime.now());
        shipment = shipments.save(shipment);

        ShipmentEvent event = new ShipmentEvent();
        event.setShipment(shipment);
        event.setStatus(ShipmentStatus.ASSIGNED);
        event.setNote("Hệ thống tự động gán shipper");
        events.save(event);

        OrderStatusHistory item = new OrderStatusHistory();
        item.setOrderId(order.getId());
        item.setFromStatus(OrderStatus.READY_TO_SHIP);
        item.setToStatus(OrderStatus.READY_TO_SHIP);
        item.setNote("Đã gán shipment tự động");
        history.save(item);

        if (shipments.countByShipper_IdAndStatusIn(shipper.getId(), ACTIVE) >= maxActive) {
            shipper.setWorkStatus(ShipperWorkStatus.BUSY);
        }
    }

    @Transactional
    public Shipment assignManually(Order order, ShipperProfile shipper, String note) {
        if (shipments.existsByOrder_Id(order.getId())) {
            throw com.vic.ecom.ultis.CustomerAccountException.conflict("SHIPMENT_EXISTS", "Đơn hàng đã có shipment", null);
        }
        assign(order, shipper);
        return shipments.findByOrder_Id(order.getId()).orElseThrow();
    }

    @Transactional
    public Shipment reassign(Order order, Set<Long> excludedShippers) {
        ShipperProfile shipper = shippers.findByUser_StatusAndWorkStatus(UserStatus.ACTIVE, ShipperWorkStatus.AVAILABLE)
                .stream()
                .filter(p -> !excludedShippers.contains(p.getId()))
                .map(p -> new Candidate(p, shipments.countByShipper_IdAndStatusIn(p.getId(), ACTIVE), false))
                .filter(c -> c.active < maxActive)
                .min(Comparator.comparingLong((Candidate c) -> c.active).thenComparing(c -> c.profile.getId()))
                .map(c -> c.profile).orElseThrow(() -> com.vic.ecom.ultis.CustomerAccountException.unprocessable(
                        "NO_SHIPPER", "Chưa có shipper phù hợp để gán lại", null));
        Shipment shipment = shipments.findByOrder_IdOrderByAssignedAtDesc(order.getId()).stream()
                .filter(s -> s.getStatus() == ShipmentStatus.FAILED)
                .findFirst()
                .orElseThrow(() -> com.vic.ecom.ultis.CustomerAccountException.conflict(
                        "SHIPMENT_NOT_FOUND", "Không tìm thấy shipment giao thất bại", null));
        shipment.setShipper(shipper);
        shipment.setStatus(ShipmentStatus.ASSIGNED);
        shipment.setAssignedAt(LocalDateTime.now());
        shipment.setPickedUpAt(null);
        shipment.setDeliveredAt(null);
        shipment.setCodCollected(false);
        shipment = shipments.save(shipment);
        ShipmentEvent event = new ShipmentEvent();
        event.setShipment(shipment);
        event.setStatus(ShipmentStatus.ASSIGNED);
        event.setNote("Admin đã gán lại shipper");
        events.save(event);
        return shipment;
    }

    private boolean matchesArea(ShipperProfile shipper, Order order) {
        String area = shipper.getServiceArea();
        String address = order.getShippingAddress();
        return area != null && address != null && !area.isBlank()
                && address.toLowerCase().contains(area.trim().toLowerCase());
    }

    private record Candidate(ShipperProfile profile, long active, boolean areaMatch) {
    }
}
