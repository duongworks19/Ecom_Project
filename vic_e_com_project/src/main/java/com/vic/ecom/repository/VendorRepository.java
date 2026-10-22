package com.vic.ecom.repository;

import com.vic.ecom.entity.Vendor;
import com.vic.ecom.enums.ApprovalStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

public interface VendorRepository extends JpaRepository<Vendor, Long> {
    Optional<Vendor> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
    List<Vendor> findByApprovalStatus(ApprovalStatus approvalStatus);
    Page<Vendor> findAllByOrderByIdDesc(Pageable pageable);
    Page<Vendor> findByApprovalStatusOrderByIdDesc(ApprovalStatus approvalStatus, Pageable pageable);
    Page<Vendor> findByBusinessNameContainingIgnoreCaseOrderByIdDesc(String businessName, Pageable pageable);
    Page<Vendor> findByApprovalStatusAndBusinessNameContainingIgnoreCaseOrderByIdDesc(ApprovalStatus approvalStatus, String businessName, Pageable pageable);
    long countByApprovalStatus(ApprovalStatus approvalStatus);
}
