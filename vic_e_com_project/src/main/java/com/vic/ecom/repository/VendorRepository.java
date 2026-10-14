package com.vic.ecom.repository;

import com.vic.ecom.entity.Vendor;
import com.vic.ecom.enums.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    List<Vendor> findByApprovalStatus(ApprovalStatus approvalStatus);
}
