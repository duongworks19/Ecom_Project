package com.vic.ecom.repository;

import com.vic.ecom.entity.Order;
import com.vic.ecom.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByCustomer_IdOrderByCreatedAtDescIdDesc(Long customerId, Pageable pageable);

    Page<Order> findByCustomer_IdAndStatusInOrderByCreatedAtDescIdDesc(
            Long customerId, Collection<OrderStatus> statuses, Pageable pageable);

    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE o.customer.id = :customerId GROUP BY o.status")
    List<Object[]> countGroupByStatusForCustomer(@Param("customerId") Long customerId);

    List<Order> findByShopIdOrderByCreatedAtDescIdDesc(Long shopId);

    Optional<Order> findByOrderCode(String orderCode);
}
