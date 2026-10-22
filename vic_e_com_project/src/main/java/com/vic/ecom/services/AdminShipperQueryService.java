package com.vic.ecom.services;

import com.vic.ecom.dto.AdminShipperDtos.*;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.*;
import com.vic.ecom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminShipperQueryService {
    private static final List<ShipmentStatus> ACTIVE = List.of(ShipmentStatus.ASSIGNED, ShipmentStatus.PICKED_UP, ShipmentStatus.DELIVERING);
    private final ShipperProfileRepository profiles;
    private final ShipmentRepository shipments;

    @Transactional(readOnly = true)
    public Page<ListItem> list(String keyword, String status, int page, int size) {
        String q = keyword == null ? "" : keyword.trim();
        Page<ShipperProfile> result = profiles.search(q, q.matches("\\d+"), status, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "user.createdAt")));
        Map<Long, Long> counts = activeCounts(result.getContent());
        return result.map(p -> item(p, counts.getOrDefault(p.getUser().getId(), 0L)));
    }

    @Transactional(readOnly = true)
    public Summary summary() {
        return new Summary(profiles.countByUser_Status(UserStatus.ACTIVE) + profiles.countByUser_Status(UserStatus.LOCKED),
                profiles.countByUser_StatusAndWorkStatus(UserStatus.ACTIVE, ShipperWorkStatus.AVAILABLE),
                profiles.countByUser_StatusAndWorkStatus(UserStatus.ACTIVE, ShipperWorkStatus.BUSY),
                profiles.countByAccountStatus(UserStatus.LOCKED), shipments.countByStatusIn(ACTIVE));
    }

    @Transactional(readOnly = true)
    public Detail detail(ShipperProfile profile, String temporaryPassword) {
        List<Object[]> rows = shipments.countByStatus(profile.getId());
        long delivered = count(rows, ShipmentStatus.DELIVERED), failed = count(rows, ShipmentStatus.FAILED);
        long active = ACTIVE.stream().mapToLong(s -> count(rows, s)).sum();
        Double rate = delivered + failed == 0 ? null : Math.round(delivered * 1000.0 / (delivered + failed)) / 10.0;
        List<Recent> recent = shipments.findTop3ByShipper_IdOrderByAssignedAtDesc(profile.getId()).stream()
                .map(s -> new Recent(s.getOrder().getOrderCode(), s.getStatus(), s.getDeliveredAt() != null ? s.getDeliveredAt() : s.getAssignedAt())).toList();
        User u = profile.getUser();
        return new Detail(u.getId(), u.getFullName(), u.getEmail(), u.getPhone(), u.getAvatarUrl(), u.getStatus().name(),
                profile.getWorkStatus(), profile.getVehicleType(), profile.getLicensePlate(), profile.getServiceArea(), profile.getCreatedAt(), active,
                new Performance(delivered, failed, rate), recent, temporaryPassword);
    }

    @Transactional(readOnly = true)
    public Page<Delivery> deliveries(Long userId, int page, int size) {
        ShipperProfile p = profiles.findByUserId(userId).orElseThrow(() -> com.vic.ecom.ultis.CustomerAccountException.notFound("SHIPPER_NOT_FOUND", "Không tìm thấy shipper"));
        return shipments.findByShipper_IdOrderByAssignedAtDesc(p.getId(), PageRequest.of(page, size)).map(s -> new Delivery(s.getId(), s.getOrder().getOrderCode(), s.getStatus(), s.getCodAmount(), s.isCodCollected(), s.getAssignedAt(), s.getDeliveredAt()));
    }

    private Map<Long, Long> activeCounts(List<ShipperProfile> ps) {
        if (ps.isEmpty()) return Map.of();
        return shipments.countActiveByShipperIds(ps.stream().map(ShipperProfile::getId).toList(), ACTIVE).stream()
                .collect(Collectors.toMap(r -> ((Number) r[0]).longValue(), r -> ((Number) r[1]).longValue()));
    }
    private ListItem item(ShipperProfile p, long count) { User u = p.getUser(); return new ListItem(u.getId(), u.getFullName(), u.getPhone(), p.getWorkStatus(), u.getStatus().name(), count, p.getServiceArea()); }
    private long count(List<Object[]> rows, ShipmentStatus status) { return rows.stream().filter(r -> r[0] == status).mapToLong(r -> ((Number) r[1]).longValue()).findFirst().orElse(0); }
}
