package com.vic.ecom.repository;

import com.vic.ecom.entity.VariantAttribute;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface VariantAttributeRepository extends JpaRepository<VariantAttribute, Long> {
    List<VariantAttribute> findByVariantIdOrderByIdAsc(Long variantId);
    List<VariantAttribute> findByVariantIdInOrderByIdAsc(java.util.Collection<Long> variantIds);
}
