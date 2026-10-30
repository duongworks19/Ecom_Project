package com.vic.ecom.repository;

import com.vic.ecom.entity.ProductVariant;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface CheckoutStockRepository extends JpaRepository<ProductVariant, Long> {
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("update ProductVariant v set v.stockQty = v.stockQty - :quantity, v.soldCount = v.soldCount + :quantity where v.id = :id and v.stockQty >= :quantity")
    int reserve(@Param("id") Long id, @Param("quantity") int quantity);
}
