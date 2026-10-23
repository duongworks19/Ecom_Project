package com.vic.ecom.repository;

import com.vic.ecom.entity.ShipmentEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShipmentEventRepository extends JpaRepository<ShipmentEvent, Long> {
    List<ShipmentEvent> findByShipment_IdOrderByCreatedAtAsc(Long shipmentId);
}
