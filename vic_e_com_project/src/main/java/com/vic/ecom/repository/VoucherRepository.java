package com.vic.ecom.repository;

import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.VoucherStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VoucherRepository extends JpaRepository<Voucher, Long> {

    List<Voucher> findByShopIdAndStatusNotOrderByIdDesc(Long shopId, VoucherStatus status);

    Optional<Voucher> findByIdAndShopIdAndStatusNot(Long id, Long shopId, VoucherStatus status);

    boolean existsByShopIdAndCodeIgnoreCaseAndStatusNot(Long shopId, String code, VoucherStatus status);

    boolean existsByShopIdAndCodeIgnoreCaseAndStatusNotAndIdNot(Long shopId, String code, VoucherStatus status, Long id);

    long countByShopIdAndStatusNot(Long shopId, VoucherStatus status);
}
