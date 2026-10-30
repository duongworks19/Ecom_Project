package com.vic.ecom.repository;

import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.VoucherStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    List<Voucher> findByShopIdAndStatusNotOrderByIdDesc(Long shopId, VoucherStatus status);

    Optional<Voucher> findByIdAndShopIdAndStatusNot(Long id, Long shopId, VoucherStatus status);

    Optional<Voucher> findByIdAndShopId(Long id, Long shopId);
    Optional<Voucher> findByShopIdAndCodeIgnoreCase(Long shopId, String code);

    List<Voucher> findByShopIdAndStatus(Long shopId, VoucherStatus status);

    boolean existsByShopIdAndCodeIgnoreCaseAndStatusNot(Long shopId, String code, VoucherStatus status);

    boolean existsByShopIdAndCodeIgnoreCaseAndStatusNotAndIdNot(Long shopId, String code, VoucherStatus status, Long id);

    long countByShopIdAndStatusNot(Long shopId, VoucherStatus status);

    @Modifying
    @Query("update Voucher v set v.usedCount = case when v.usedCount > 0 then v.usedCount - 1 else 0 end where v.id = :id and v.usedCount > 0")
    int releaseUsage(@Param("id") Long id);

    @Modifying
    @Query("update Voucher v set v.usedCount = v.usedCount + 1 where v.id = :id and v.usedCount < v.usageLimit and v.status = com.vic.ecom.enums.VoucherStatus.ACTIVE")
    int reserveUsage(@Param("id") Long id);
}
