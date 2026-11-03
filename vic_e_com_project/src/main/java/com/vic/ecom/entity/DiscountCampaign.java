package com.vic.ecom.entity;

import com.vic.ecom.enums.CampaignStatus;
import com.vic.ecom.enums.CampaignType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "discount_campaigns")
@Getter
@Setter
public class DiscountCampaign {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(length = 255, columnDefinition = "VARCHAR(255) DEFAULT 'Chương trình giảm giá'")
    private String name = "Chương trình giảm giá";

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'FLASH_SALE'")
    private CampaignType type = CampaignType.FLASH_SALE;

    @Column(name = "discount_percent", columnDefinition = "INT DEFAULT 10")
    private Integer discountPercent = 10;

    @Column(name = "product_count", columnDefinition = "INT DEFAULT 1")
    private Integer productCount = 1;

    @Column(name = "start_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime startAt = LocalDateTime.now();

    @Column(name = "end_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime endAt = LocalDateTime.now().plusDays(7);

    @Enumerated(EnumType.STRING)
    @Column(length = 20, columnDefinition = "VARCHAR(20) DEFAULT 'ACTIVE'")
    private CampaignStatus status = CampaignStatus.ACTIVE;

    @Column(name = "created_at", columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP", updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public DiscountCampaign() {}
}
