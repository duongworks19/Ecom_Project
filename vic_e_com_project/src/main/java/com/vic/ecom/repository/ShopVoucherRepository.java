package com.vic.ecom.repository;

import com.vic.ecom.entity.ShopVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShopVoucherRepository extends JpaRepository<ShopVoucher, Long> {
    List<ShopVoucher> findByShopIdOrderByIdDesc(Long shopId);
}
