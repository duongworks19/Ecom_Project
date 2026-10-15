package com.vic.ecom.repository;

import com.vic.ecom.entity.VendorViolation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VendorViolationRepository extends JpaRepository<VendorViolation, Long> {
    List<VendorViolation> findByVendorId(Long vendorId);
}
