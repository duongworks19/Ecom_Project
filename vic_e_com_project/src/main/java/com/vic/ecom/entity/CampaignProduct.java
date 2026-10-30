package com.vic.ecom.entity;

import com.vic.ecom.enums.VoucherDiscountType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;

@Entity @Table(name = "campaign_products") @Getter @Setter
public class CampaignProduct {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "campaign_id", nullable = false) private DiscountCampaign campaign;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "variant_id", nullable = false) private ProductVariant variant;
    @Enumerated(EnumType.STRING) @Column(name = "discount_type", nullable = false, length = 20) private VoucherDiscountType discountType;
    @Column(name = "discount_value", nullable = false, precision = 12, scale = 2) private BigDecimal discountValue;
    @Column(nullable = false) private Integer quota;
    @Column(name = "sold_count", nullable = false) private Integer soldCount = 0;
    public CampaignProduct() {}
}
