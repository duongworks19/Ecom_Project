package com.vic.ecom.services;

import com.vic.ecom.dto.ShipperPortalDtos;
import com.vic.ecom.entity.ShipperProfile;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.ShipmentStatus;
import com.vic.ecom.repository.ShipmentRepository;
import com.vic.ecom.repository.ShipperProfileRepository;
import com.vic.ecom.repository.ShipperShipmentRepository;
import com.vic.ecom.repository.ShipmentEventRepository;
import com.vic.ecom.repository.DeliveryFailureRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class ShipperPortalQueryService {
    private final UserRepository users;
    private final ShipperProfileRepository profiles;
    private final ShipmentRepository shipments;
    private final ShipperShipmentRepository shipperShipments;
    private final ShipmentEventRepository events;
    private final DeliveryFailureRepository failures;

    public ShipperProfile requireProfile(Authentication auth) {
        User user = users.findByEmail(auth.getName()).or(() -> users.findByPhone(auth.getName()))
                .orElseThrow(() -> CustomerAccountException.unauthorized("Unauthorized"));
        return profiles.findByUserId(user.getId()).orElseThrow(() ->
                CustomerAccountException.notFound("SHIPPER_NOT_FOUND", "Không tìm thấy hồ sơ shipper"));
    }

    public ShipperPortalDtos.Profile profile(Authentication auth) {
        ShipperProfile p = requireProfile(auth);
        User u = p.getUser();
        return new ShipperPortalDtos.Profile(p.getId(), u.getId(), u.getFullName(), code(p), u.getEmail(),
                u.getPhone(), u.getAvatarUrl(), p.getVehicleType(), p.getLicensePlate(), null,
                p.getServiceArea(), null, p.getCreatedAt().toLocalDate().toString(), null, p.getWorkStatus());
    }

    public ShipperPortalDtos.Kpi kpi(Authentication auth) {
        Long id = requireProfile(auth).getId();
        long ready = shipments.countByShipper_IdAndStatusIn(id, List.of(ShipmentStatus.ASSIGNED));
        long delivering = shipments.countByShipper_IdAndStatusIn(id, List.of(ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING));
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        LocalDateTime from = today.atStartOfDay();
        LocalDateTime to = today.plusDays(1).atStartOfDay();
        long delivered = shipperShipments.countByShipper_IdAndStatusAndDeliveredAtGreaterThanEqualAndDeliveredAtLessThan(id, ShipmentStatus.DELIVERED, from, to);
        long failed = shipperShipments.countByShipper_IdAndStatusAndDeliveredAtGreaterThanEqualAndDeliveredAtLessThan(id, ShipmentStatus.FAILED, from, to);
        BigDecimal cod = shipperShipments.sumCollectedCod(id, ShipmentStatus.DELIVERED, from, to);
        Double rate = delivered + failed == 0 ? null : (double) delivered / (delivered + failed) * 100;
        return new ShipperPortalDtos.Kpi(ready, delivering, delivered, failed, cod, rate);
    }

    public void setWorkStatus(Authentication auth, boolean available) {
        ShipperProfile p = requireProfile(auth);
        if (!available) { p.setWorkStatus(com.vic.ecom.enums.ShipperWorkStatus.OFFLINE); return; }
        boolean active = shipments.existsByShipper_IdAndStatusIn(p.getId(),
                List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING));
        p.setWorkStatus(active ? com.vic.ecom.enums.ShipperWorkStatus.BUSY : com.vic.ecom.enums.ShipperWorkStatus.AVAILABLE);
    }

    public List<ShipperPortalDtos.Item> list(Authentication auth, String status) {
        Long id = requireProfile(auth).getId();
        List<ShipmentStatus> statuses = switch (status == null ? "ALL" : status) {
            case "ALL" -> List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING, ShipmentStatus.DELIVERED, ShipmentStatus.FAILED);
            case "READY_TO_PICK" -> List.of(ShipmentStatus.ASSIGNED);
            case "DELIVERING" -> List.of(ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING);
            case "DELIVERED" -> List.of(ShipmentStatus.DELIVERED);
            case "FAILED" -> List.of(ShipmentStatus.FAILED);
            default -> throw CustomerAccountException.badRequest("INVALID_STATUS", "Tham số status không hợp lệ", "status");
        };
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"));
        return shipperShipments.findByShipper_IdAndStatusInOrderByAssignedAtAsc(id, statuses).stream()
                .filter(s -> s.getStatus() == ShipmentStatus.ASSIGNED || s.getStatus() == ShipmentStatus.PICKED_UP
                        || s.getStatus() == ShipmentStatus.DELIVERING
                        || (s.getDeliveredAt() != null && s.getDeliveredAt().toLocalDate().equals(today)))
                .map(this::item).toList();
    }

    public ShipperPortalDtos.Item detail(Authentication auth, Long shipmentId) {
        return shipperShipments.findByIdAndShipper_Id(shipmentId, requireProfile(auth).getId()).map(this::item)
                .orElseThrow(() -> CustomerAccountException.notFound("SHIPMENT_NOT_FOUND", "Không tìm thấy đơn giao hàng"));
    }

    public List<ShipperPortalDtos.Item> history(Authentication auth) {
        return shipperShipments.findByShipper_IdAndStatusInOrderByDeliveredAtDesc(requireProfile(auth).getId(), List.of(ShipmentStatus.DELIVERED, ShipmentStatus.FAILED)).stream().map(this::item).toList();
    }

    private ShipperPortalDtos.Item item(com.vic.ecom.entity.Shipment s) {
        List<ShipperPortalDtos.Event> eventList = events.findByShipment_IdOrderByCreatedAtAsc(s.getId()).stream().map(e -> new ShipperPortalDtos.Event(e.getId(), s.getId(), e.getStatus(), e.getCreatedAt(), e.getStatus().name(), e.getNote())).toList();
        ShipperPortalDtos.Failure failure = failures.findTopByShipment_IdOrderByCreatedAtDesc(s.getId()).map(f -> new ShipperPortalDtos.Failure(f.getId(), s.getId(), f.getReason(), f.getReason(), f.getCreatedAt())).orElse(null);
        return new ShipperPortalDtos.Item(s.getId(), s.getOrder().getId(), "SPX-" + String.format("%05d", s.getId()), s.getShipper().getId(), s.getStatus(), s.getCodAmount(), null, null, null, null, null, null, null, null, s.getAssignedAt(), eventList, failure);
    }

    private String code(ShipperProfile p) { return "SHP-" + p.getCreatedAt().getYear() + "-" + String.format("%04d", p.getId()); }
}
