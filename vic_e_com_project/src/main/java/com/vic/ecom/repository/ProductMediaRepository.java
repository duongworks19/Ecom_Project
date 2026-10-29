package com.vic.ecom.repository;

import com.vic.ecom.entity.ProductMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface ProductMediaRepository extends JpaRepository<ProductMedia, Long> {
    List<ProductMedia> findByProductIdOrderBySortOrderAscIdAsc(Long productId);
    List<ProductMedia> findByProductIdInOrderBySortOrderAscIdAsc(java.util.Collection<Long> productIds);
    @Modifying
    @Query("delete from ProductMedia m where m.productId = :productId")
    void deleteByProductId(Long productId);
}
