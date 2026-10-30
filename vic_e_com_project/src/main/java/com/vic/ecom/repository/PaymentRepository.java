package com.vic.ecom.repository;

import com.vic.ecom.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.vic.ecom.entity.Order;
import java.util.Optional;
import org.springframework.stereotype.Repository;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    java.util.List<Payment> findByOrderOrderByPaidAtDescIdDesc(Order order);
    java.util.List<Payment> findByOrder_IdOrderByPaidAtDescIdDesc(Long orderId);

    @Modifying
    @Query(value = "ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check", nativeQuery = true)
    void dropLegacyStatusCheckConstraint();

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query(value = "UPDATE payments SET status = 'FAILED' WHERE order_id = :orderId", nativeQuery = true)
    int markPaymentsFailedByOrderId(@Param("orderId") Long orderId);
}
