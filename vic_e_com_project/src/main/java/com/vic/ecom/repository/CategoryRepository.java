package com.vic.ecom.repository;

import com.vic.ecom.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsBySlug(String slug);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsByParentId(Long parentId);
    List<Category> findAllByOrderByIdAsc();
    List<Category> findAllByParentId(Long parentId);
}
