package com.vic.ecom.repository;

import com.vic.ecom.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {

    List<OrderItem> findByOrder_IdInOrderByIdAsc(Collection<Long> orderIds);

    List<OrderItem> findByOrder_IdOrderByIdAsc(Long orderId);
}
