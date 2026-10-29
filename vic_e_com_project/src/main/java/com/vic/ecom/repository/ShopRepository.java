package com.vic.ecom.repository;

import com.vic.ecom.entity.Shop;
import com.vic.ecom.enums.ShopStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ShopRepository extends JpaRepository<Shop, Long> {
    Optional<Shop> findByVendorId(Long vendorId);
    boolean existsByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCaseAndVendorIdNot(String name, Long vendorId);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCaseAndVendorIdNot(String email, Long vendorId);
    boolean existsByPhone(String phone);
    boolean existsByPhoneAndVendorIdNot(String phone, Long vendorId);
    List<Shop> findByStatus(ShopStatus status);

    @org.springframework.data.jpa.repository.Query("SELECT s FROM Shop s WHERE s.status = 'ACTIVE' AND (LOWER(s.name) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :kw, '%')) OR LOWER(s.tagline) LIKE LOWER(CONCAT('%', :kw, '%')))")
    List<Shop> searchActiveShops(@org.springframework.data.repository.query.Param("kw") String keyword);
}
