package com.vic.ecom.repository;

import com.vic.ecom.entity.Shipment;
import com.vic.ecom.enums.ShipmentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ShipmentRepository extends JpaRepository<Shipment, Long> {
    long countByShipper_IdAndStatusIn(Long shipperId, Collection<ShipmentStatus> statuses);
    long countByStatusIn(Collection<ShipmentStatus> statuses);
    boolean existsByShipper_IdAndStatusIn(Long shipperId, Collection<ShipmentStatus> statuses);
    Page<Shipment> findByShipper_IdOrderByAssignedAtDesc(Long shipperId, Pageable pageable);
    List<Shipment> findTop3ByShipper_IdOrderByAssignedAtDesc(Long shipperId);

    @Query("select s.shipper.id, count(s) from Shipment s where s.shipper.id in :ids and s.status in :statuses group by s.shipper.id")
    List<Object[]> countActiveByShipperIds(@Param("ids") Collection<Long> ids,
                                           @Param("statuses") Collection<ShipmentStatus> statuses);

    @Query("select s.status, count(s) from Shipment s where s.shipper.id = :shipperId group by s.status")
    List<Object[]> countByStatus(@Param("shipperId") Long shipperId);
}
