package com.vic.ecom.entity;

import com.vic.ecom.enums.ShopStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "shops")
@Getter
@Setter
public class Shop {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_id", nullable = false, unique = true)
    private Vendor vendor;

    @Column(nullable = false, unique = true, length = 150)
    private String name;

    @Column(length = 255)
    private String tagline;

    @Column(length = 500)
    private String logo;

    @Column(length = 500)
    private String banner;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 30)
    private String phone;

    @Column(length = 150)
    private String email;

    @Column(name = "pickup_address", length = 500)
    private String pickupAddress;

    @Column(name = "business_hours", length = 255)
    private String businessHours;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ShopStatus status = ShopStatus.ACTIVE;

    @Column(name = "rating_avg", precision = 2, scale = 1)
    private BigDecimal ratingAvg = BigDecimal.valueOf(0.0);

    @OneToMany(mappedBy = "shop", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ShopReview> reviews = new ArrayList<>();

    public Shop() {
    }
}
