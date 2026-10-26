package com.vic.ecom.repository;

import com.vic.ecom.entity.ShipperProfile;
import com.vic.ecom.enums.ShipperWorkStatus;
import com.vic.ecom.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface ShipperProfileRepository extends JpaRepository<ShipperProfile, Long> {
    Optional<ShipperProfile> findByUserId(Long userId);

    @Query("select p from ShipperProfile p join fetch p.user u where u.role = com.vic.ecom.enums.UserRole.SHIPPER " +
            "and (:status = 'ALL' or (:status = 'LOCKED' and u.status = com.vic.ecom.enums.UserStatus.LOCKED) " +
            "or (:status <> 'LOCKED' and u.status = com.vic.ecom.enums.UserStatus.ACTIVE and str(p.workStatus) = :status)) " +
            "and (:keyword = '' or (:numeric = true and (str(u.id) = :keyword or u.phone like concat('%', :keyword, '%'))) " +
            "or (:numeric = false and lower(coalesce(u.fullName,'')) like lower(concat('%', :keyword, '%'))))")
    Page<ShipperProfile> search(@Param("keyword") String keyword, @Param("numeric") boolean numeric,
                                @Param("status") String status, Pageable pageable);

    @Query("select count(p) from ShipperProfile p join p.user u where u.role = com.vic.ecom.enums.UserRole.SHIPPER and u.status = :status")
    long countByAccountStatus(@Param("status") UserStatus status);

    long countByUser_StatusAndWorkStatus(UserStatus status, ShipperWorkStatus workStatus);
    long countByUser_Status(UserStatus status);

    List<ShipperProfile> findByUser_StatusAndWorkStatus(UserStatus status, ShipperWorkStatus workStatus);
    List<ShipperProfile> findByUser_Status(UserStatus status);
}
