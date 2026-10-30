package com.vic.ecom.repository;

import com.vic.ecom.entity.CampaignProduct;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CampaignProductRepository extends JpaRepository<CampaignProduct, Long> {
    Optional<CampaignProduct> findFirstByVariant_IdAndCampaign_StatusAndCampaign_StartAtBeforeAndCampaign_EndAtAfterOrderByIdDesc(Long variantId, com.vic.ecom.enums.CampaignStatus status, java.time.LocalDateTime start, java.time.LocalDateTime end);
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("update CampaignProduct c set c.soldCount = c.soldCount + :quantity where c.id = :id and c.soldCount + :quantity <= c.quota")
    int reserveQuota(@org.springframework.data.repository.query.Param("id") Long id, @org.springframework.data.repository.query.Param("quantity") int quantity);
}
