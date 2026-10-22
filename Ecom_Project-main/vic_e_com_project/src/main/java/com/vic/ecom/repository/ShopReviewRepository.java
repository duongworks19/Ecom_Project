package com.vic.ecom.repository;

import com.vic.ecom.entity.ShopReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ShopReviewRepository extends JpaRepository<ShopReview, Long> {
    List<ShopReview> findByShopId(Long shopId);
    List<ShopReview> findByShopIdOrderByIdDesc(Long shopId);
    List<ShopReview> findByCustomerId(Long customerId);
}
