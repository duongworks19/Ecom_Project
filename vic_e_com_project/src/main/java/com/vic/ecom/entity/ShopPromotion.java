package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "shop_promotions")
@Getter
@Setter
public class ShopPromotion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(name = "discount_percent", nullable = false)
    private Integer discountPercent = 10;

    @Column(name = "product_count", nullable = false)
    private Integer productCount = 1;

    @Column(name = "time_range", length = 150)
    private String timeRange;

    @Column(nullable = false, length = 30)
    private String status = "RUNNING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ShopPromotion() {
    }
}
