package com.vic.ecom.repository;

import com.vic.ecom.entity.InventoryLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryLogRepository extends JpaRepository<InventoryLog, Long> {

    List<InventoryLog> findByOrderIdOrderByIdAsc(Long orderId);
}
