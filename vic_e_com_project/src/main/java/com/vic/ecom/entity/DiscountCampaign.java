package com.vic.ecom.entity;

import com.vic.ecom.enums.CampaignStatus;
import com.vic.ecom.enums.CampaignType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity @Table(name = "discount_campaigns") @Getter @Setter
public class DiscountCampaign {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "shop_id", nullable = false) private Shop shop;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private CampaignType type;
    @Column(name = "start_at", nullable = false) private LocalDateTime startAt;
    @Column(name = "end_at", nullable = false) private LocalDateTime endAt;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20) private CampaignStatus status;
    @Column(nullable = false, updatable = false) private LocalDateTime createdAt = LocalDateTime.now();
    public DiscountCampaign() {}
}
