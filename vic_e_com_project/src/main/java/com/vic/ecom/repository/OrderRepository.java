package com.vic.ecom.repository;

import com.vic.ecom.entity.Order;
import com.vic.ecom.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    @Query("select distinct o from Order o left join o.customer c left join o.shop s left join Payment p on p.order = o left join o.shipments sh left join o.returnRequests rr " +
            "where (:q = '' or lower(o.orderCode) like concat('%', :q, '%') or lower(o.receiverName) like concat('%', :q, '%') or o.receiverPhone like concat('%', :q, '%') or lower(c.fullName) like concat('%', :q, '%') or lower(s.name) like concat('%', :q, '%')) " +
            "and (:shopId = 0 or o.shopId = :shopId) and (:paymentMethod is null or p.method = :paymentMethod) " +
            "and o.createdAt >= :from and o.createdAt < :to " +
            "and (:chip is null or (:chip = 'delivery_failed' and sh.status = com.vic.ecom.enums.ShipmentStatus.FAILED) " +
            "or :chip = 'return_refund' and rr.status = com.vic.ecom.enums.ReturnRequestStatus.PENDING " +
            "or :chip not in ('delivery_failed', 'return_refund') and o.status in :statuses)")
    Page<Order> search(@Param("q") String q, @Param("shopId") Long shopId, @Param("paymentMethod") com.vic.ecom.enums.PaymentMethod paymentMethod, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("chip") String chip, @Param("statuses") Collection<OrderStatus> statuses, Pageable pageable);

    Page<Order> findByCustomer_IdOrderByCreatedAtDescIdDesc(Long customerId, Pageable pageable);

    Page<Order> findByCustomer_IdAndStatusInOrderByCreatedAtDescIdDesc(
            Long customerId, Collection<OrderStatus> statuses, Pageable pageable);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.customer.id = :customerId GROUP BY o.status")
    List<Object[]> countGroupByStatusForCustomer(@Param("customerId") Long customerId);

    List<Order> findByShopIdOrderByCreatedAtDescIdDesc(Long shopId);

    Optional<Order> findByOrderCode(String orderCode);

    @Query("select o.status, count(o) from Order o group by o.status")
    List<Object[]> countGroupByStatus();

    long countByStatusAndCreatedAtBefore(OrderStatus status, LocalDateTime before);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from Order o where o.status = :status and not exists (select s.id from Shipment s where s.order = o) order by o.createdAt asc, o.id asc")
    List<Order> findReadyWithoutShipment(@Param("status") OrderStatus status);
}
