package com.vic.ecom.repository;

import com.vic.ecom.entity.ShopProduct;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopProductRepository extends JpaRepository<ShopProduct, Long> {
    List<ShopProduct> findByShopIdOrderByIdDesc(Long shopId);
}
