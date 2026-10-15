package com.vic.ecom.repository;

import com.vic.ecom.entity.ShopPromotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopPromotionRepository extends JpaRepository<ShopPromotion, Long> {
    List<ShopPromotion> findByShopIdOrderByIdDesc(Long shopId);
}
