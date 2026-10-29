package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "shop_reviews")
@Getter
@Setter
public class ShopReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @Column(name = "customer_name", length = 150)
    private String customerName;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(nullable = false)
    private Integer rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(columnDefinition = "TEXT")
    private String reply;

    @Column(name = "product_id")
    private Long productId;

    @Column(name = "type", length = 20)
    private String type = "REVIEW"; // "REVIEW" or "QA"

    @Column(name = "review_image", length = 500)
    private String reviewImage;

    @Column(name = "helpful_count")
    private Integer helpfulCount = 0;

    @Column(name = "verified_purchase")
    private Boolean verifiedPurchase = true;

    @Column(name = "created_at_label", length = 100)
    private String createdAtLabel;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ShopReview() {
    }
}
