package com.vic.ecom.repository;

import com.vic.ecom.entity.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

@Repository
public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    Optional<CartItem> findByCartIdAndVariantId(Long cartId, Long variantId);

    @EntityGraph(attributePaths = {"variant", "variant.product", "variant.product.shop"})
    List<CartItem> findByCartIdOrderByIdAsc(Long cartId);
    List<CartItem> findByCartIdAndIdIn(Long cartId, List<Long> ids);
    int deleteByCartIdAndIdIn(Long cartId, List<Long> ids);
}
