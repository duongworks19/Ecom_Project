package com.vic.ecom.repository;

import com.vic.ecom.entity.ShopOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ShopOrderRepository extends JpaRepository<ShopOrder, Long> {
    List<ShopOrder> findByShopIdOrderByIdDesc(Long shopId);
    Optional<ShopOrder> findByOrderCode(String orderCode);
}
