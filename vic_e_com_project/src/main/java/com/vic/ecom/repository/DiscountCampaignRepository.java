package com.vic.ecom.repository;

import com.vic.ecom.entity.DiscountCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountCampaignRepository extends JpaRepository<DiscountCampaign, Long> {
    List<DiscountCampaign> findByShopIdOrderByIdDesc(Long shopId);
}
