package com.vic.ecom.repository;

import com.vic.ecom.entity.DeliveryFailure;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DeliveryFailureRepository extends JpaRepository<DeliveryFailure, Long> {
    List<DeliveryFailure> findByShipment_IdOrderByCreatedAtAsc(Long shipmentId);
    Optional<DeliveryFailure> findTopByShipment_IdOrderByCreatedAtDesc(Long shipmentId);
    long countByShipment_Order_Id(Long orderId);
}
