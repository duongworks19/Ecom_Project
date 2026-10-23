package com.vic.ecom.repository;

import com.vic.ecom.entity.Shipment;
import com.vic.ecom.enums.ShipmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.math.BigDecimal;

public interface ShipperShipmentRepository extends JpaRepository<Shipment, Long> {
    List<Shipment> findByShipper_IdAndStatusInOrderByAssignedAtAsc(Long shipperId, Collection<ShipmentStatus> statuses);
    List<Shipment> findByShipper_IdAndStatusInOrderByDeliveredAtDesc(Long shipperId, Collection<ShipmentStatus> statuses);
    Optional<Shipment> findByIdAndShipper_Id(Long id, Long shipperId);
    long countByShipper_IdAndStatusAndDeliveredAtGreaterThanEqualAndDeliveredAtLessThan(Long shipperId, ShipmentStatus status, LocalDateTime from, LocalDateTime to);
    @Query("select coalesce(sum(s.codAmount), 0) from Shipment s where s.shipper.id = :shipper and s.status = :status and s.codCollected = true and s.deliveredAt >= :from and s.deliveredAt < :to")
    BigDecimal sumCollectedCod(@Param("shipper") Long shipper, @Param("status") ShipmentStatus status, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    @Modifying
    @Query("update Shipment s set s.status = :to, s.pickedUpAt = :at where s.id = :id and s.shipper.id = :shipper and s.status = :from")
    int pickup(@Param("id") Long id, @Param("shipper") Long shipper, @Param("from") ShipmentStatus from, @Param("to") ShipmentStatus to, @Param("at") java.time.LocalDateTime at);
    @Modifying
    @Query("update Shipment s set s.status = :to, s.deliveredAt = :at, s.codCollected = :collected where s.id = :id and s.shipper.id = :shipper and s.status in :from")
    int complete(@Param("id") Long id, @Param("shipper") Long shipper, @Param("from") Collection<ShipmentStatus> from, @Param("to") ShipmentStatus to, @Param("at") java.time.LocalDateTime at, @Param("collected") boolean collected);
    @Modifying
    @Query("update Shipment s set s.status = :to where s.id = :id and s.shipper.id = :shipper and s.status in :from")
    int fail(@Param("id") Long id, @Param("shipper") Long shipper, @Param("from") Collection<ShipmentStatus> from, @Param("to") ShipmentStatus to);
}
