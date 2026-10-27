package com.vic.ecom.repository;

import com.vic.ecom.entity.VoucherUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoucherUsageRepository extends JpaRepository<VoucherUsage, Long> {

    List<VoucherUsage> findByOrderId(Long orderId);

    void deleteByOrderId(Long orderId);

    @Modifying
    @Query("DELETE FROM VoucherUsage vu WHERE vu.voucherId = :voucherId")
    void deleteByVoucherId(@Param("voucherId") Long voucherId);
}
