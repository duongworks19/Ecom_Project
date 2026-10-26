package com.vic.ecom.repository;

import com.vic.ecom.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.stream.Collectors;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    long countByCategoryId(Long categoryId);
    long countByCategoryIdAndStatusNot(Long categoryId, String status);

    List<Product> findAllByStatusNot(String status);

    List<Product> findByShopIdOrderByIdDesc(Long shopId);

    List<Product> findByShopIdAndStatusNotOrderByIdDesc(Long shopId, String status);

    List<Product> findByShopIdAndStatusOrderByIdDesc(Long shopId, String status);

    Optional<Product> findByIdAndShopId(Long id, Long shopId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants WHERE p.shop.id = :shopId AND p.status != 'DELETED' ORDER BY p.id DESC")
    List<Product> findActiveProductsWithVariantsByShopId(@Param("shopId") Long shopId);

    @Query("SELECT p FROM Product p LEFT JOIN FETCH p.variants WHERE p.shop.id = :shopId AND p.status = :status ORDER BY p.id DESC")
    List<Product> findProductsByShopIdAndStatusWithVariants(@Param("shopId") Long shopId, @Param("status") String status);
}
