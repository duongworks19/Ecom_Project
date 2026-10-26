package com.vic.ecom.services;

import com.vic.ecom.dto.AdminDispatchDtos;
import com.vic.ecom.entity.Order;
import com.vic.ecom.entity.Shipment;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.enums.ShipmentStatus;
import com.vic.ecom.enums.ShipperWorkStatus;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.DeliveryFailureRepository;
import com.vic.ecom.repository.OrderRepository;
import com.vic.ecom.repository.ShipmentEventRepository;
import com.vic.ecom.repository.ShipmentRepository;
import com.vic.ecom.repository.ShipperProfileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminDispatchQueryService {
    private final OrderRepository orders;
    private final ShipmentRepository shipments;
    private final ShipperProfileRepository shippers;
    private final ShipmentEventRepository events;
    private final DeliveryFailureRepository failures;

    @Value("${dispatch.max-active-per-shipper:2}")
    private int maxActive;

    @Transactional
    public AdminDispatchDtos.Summary summary() {
        var waiting = orders.findReadyWithoutShipment(OrderStatus.READY_TO_SHIP).size();
        var delivering = shipments.countByStatusIn(List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING));
        var failed = shipments.countByStatusIn(List.of(ShipmentStatus.FAILED));
        var delivered = shipments.countByStatusIn(List.of(ShipmentStatus.DELIVERED));
        var items = shippers.findByUser_Status(UserStatus.ACTIVE)
                .stream().map(p -> new AdminDispatchDtos.Shipper(p.getId(), p.getUser().getFullName(),
                        p.getWorkStatus().name(), shipments.countByShipper_IdAndStatusIn(p.getId(), List.of(
                                ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING)), maxActive)).toList();
        return new AdminDispatchDtos.Summary(new AdminDispatchDtos.Counts(waiting, delivering, failed, delivered), true, LocalDateTime.now(), items);
    }

    @Transactional
    public AdminDispatchDtos.Page<AdminDispatchDtos.Item> items(String status, int page, int size) {
        List<Order> all = orders.findAll();
        List<AdminDispatchDtos.Item> result = all.stream().map(this::item).filter(i -> status == null || status.isBlank() || i.displayStatus().equals(status)).toList();
        int from = Math.min(page * size, result.size());
        int to = Math.min(from + size, result.size());
        return new AdminDispatchDtos.Page<>(result.subList(from, to), page, size, result.size());
    }

    @Transactional
    public AdminDispatchDtos.Detail detail(Long id) {
        Order order = orders.findById(id).orElseThrow(() -> com.vic.ecom.ultis.CustomerAccountException.notFound("ORDER_NOT_FOUND", "Không tìm thấy đơn hàng"));
        Shipment shipment = shipments.findByOrder_Id(id).orElse(null);
        var item = item(order);
        var eventItems = shipment == null ? List.<AdminDispatchDtos.Event>of() : events.findByShipment_IdOrderByCreatedAtAsc(shipment.getId()).stream()
                .map(e -> new AdminDispatchDtos.Event(e.getStatus().name(), e.getNote(), e.getCreatedAt())).toList();
        return new AdminDispatchDtos.Detail(id, order.getOrderCode(), shipment == null ? null : "SHP-" + shipment.getId(),
                order.getShippingAddress(), item.displayStatus(), item, eventItems);
    }

    private AdminDispatchDtos.Item item(Order order) {
        Shipment shipment = shipments.findByOrder_Id(order.getId()).orElse(null);
        String status = shipment == null ? "WAITING" : shipment.getStatus().name();
        if (shipment != null && List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING).contains(shipment.getStatus())) status = "DELIVERING";
        return new AdminDispatchDtos.Item(order.getId(), order.getOrderCode(), order.getShippingAddress(), null,
                order.getReceiverName(), order.getReceiverPhone(), order.getTotalAmount(), status,
                shipment == null ? null : shipment.getShipper().getUser().getFullName(),
                shipment == null ? 0 : (int) failures.countByShipment_Order_Id(order.getId()),
                shipment == null ? "Đang chờ hệ thống tự động gán shipper" : null);
    }
}
