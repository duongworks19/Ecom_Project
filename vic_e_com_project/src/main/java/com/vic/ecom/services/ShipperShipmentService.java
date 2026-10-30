package com.vic.ecom.services;

import com.vic.ecom.dto.ShipperPortalDtos;
import com.vic.ecom.entity.DeliveryFailure;
import com.vic.ecom.entity.ShipmentEvent;
import com.vic.ecom.enums.FailureReason;
import com.vic.ecom.enums.ShipmentStatus;
import com.vic.ecom.enums.ShipperWorkStatus;
import com.vic.ecom.repository.DeliveryFailureRepository;
import com.vic.ecom.repository.ShipmentEventRepository;
import com.vic.ecom.repository.ShipperShipmentRepository;
import com.vic.ecom.repository.PaymentRepository;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.enums.PaymentStatus;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShipperShipmentService {
    private final ShipperPortalQueryService query;
    private final ShipperShipmentRepository shipments;
    private final ShipmentEventRepository events;
    private final DeliveryFailureRepository failures;
    private final PaymentRepository payments;
    private final DispatchService dispatch;

    @Transactional public ShipperPortalDtos.Item pickup(Authentication auth, Long id) {
        var s = owned(auth, id);
        if (shipments.pickup(id, s.getShipper().getId(), ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, LocalDateTime.now()) == 0) invalid();
        s.getOrder().setStatus(OrderStatus.SHIPPING); s.getShipper().setWorkStatus(ShipperWorkStatus.BUSY); shipments.save(s); event(s, ShipmentStatus.PICKED_UP, "Shipper đã nhận hàng"); return query.detail(auth, id);
    }
    @Transactional public ShipperPortalDtos.Item delivered(Authentication auth, Long id, BigDecimal collectedCod) {
        var s = owned(auth, id);
        if (s.getStatus() != ShipmentStatus.PICKED_UP && s.getStatus() != ShipmentStatus.DELIVERING) invalid();
        if (s.getCodAmount().signum() > 0 && (collectedCod == null || s.getCodAmount().compareTo(collectedCod) != 0)) throw CustomerAccountException.unprocessable("COD_MISMATCH", "Số tiền COD không khớp", "collectedCod");
        if (shipments.complete(id, s.getShipper().getId(), List.of(ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING), ShipmentStatus.DELIVERED, LocalDateTime.now(), s.getCodAmount().signum() > 0) == 0) invalid();
        s.getOrder().setStatus(OrderStatus.DELIVERED); s.getOrder().setDeliveredAt(LocalDateTime.now()); s.getShipper().setWorkStatus(ShipperWorkStatus.AVAILABLE); payments.findByOrderOrderByPaidAtDescIdDesc(s.getOrder()).stream().findFirst().ifPresent(p -> { p.setStatus(PaymentStatus.PAID.name()); payments.save(p); }); shipments.save(s); event(s, ShipmentStatus.DELIVERED, "Giao hàng thành công"); dispatch.dispatchPendingOrders(); return query.detail(auth, id);
    }
    @Transactional public ShipperPortalDtos.Item failure(Authentication auth, Long id, String reason, String notes) {
        var s = owned(auth, id); if (s.getStatus() != ShipmentStatus.PICKED_UP && s.getStatus() != ShipmentStatus.DELIVERING) invalid();
        try { FailureReason.valueOf(reason); } catch (Exception e) { throw CustomerAccountException.unprocessable("INVALID_REASON", "Lý do giao thất bại không hợp lệ", "reason"); }
        String text = reason + (notes == null || notes.isBlank() ? "" : ": " + notes.trim()); if (text.length() > 500) text = text.substring(0, 500);
        if (shipments.fail(id, s.getShipper().getId(), List.of(ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING), ShipmentStatus.FAILED) == 0) invalid();
        s.getShipper().setWorkStatus(ShipperWorkStatus.AVAILABLE); shipments.save(s);
        DeliveryFailure f = new DeliveryFailure(); f.setShipment(s); f.setReason(text); f.setAttemptNo((int) failures.countByShipment_Order_Id(s.getOrder().getId()) + 1); failures.save(f); event(s, ShipmentStatus.FAILED, text); dispatch.dispatchPendingOrders(); return query.detail(auth, id);
    }
    private com.vic.ecom.entity.Shipment owned(Authentication a, Long id) { return shipments.findByIdAndShipper_Id(id, query.requireProfile(a).getId()).orElseThrow(() -> CustomerAccountException.notFound("SHIPMENT_NOT_FOUND", "Không tìm thấy đơn giao hàng")); }
    private void event(com.vic.ecom.entity.Shipment s, ShipmentStatus status, String note) { ShipmentEvent e = new ShipmentEvent(); e.setShipment(s); e.setStatus(status); e.setNote(note); events.save(e); }
    private void invalid() { throw CustomerAccountException.conflict("INVALID_STATE", "Shipment không ở trạng thái cho phép", null); }
}
