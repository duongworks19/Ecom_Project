package com.vic.ecom.repository;

import com.vic.ecom.entity.ProductMedia;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProductMediaRepository extends JpaRepository<ProductMedia, Long> {
    List<ProductMedia> findByProductIdOrderBySortOrderAscIdAsc(Long productId);
    List<ProductMedia> findByProductIdInOrderBySortOrderAscIdAsc(java.util.Collection<Long> productIds);
}
