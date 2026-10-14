package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "shop_orders")
@Getter
@Setter
public class ShopOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    @Column(name = "order_code", nullable = false, unique = true, length = 50)
    private String orderCode;

    @Column(name = "customer_name", nullable = false, length = 150)
    private String customerName;

    @Column(name = "customer_phone", length = 30)
    private String customerPhone;

    @Column(name = "shipping_address", length = 500)
    private String shippingAddress;

    @Column(name = "created_at_label", length = 100)
    private String createdAtLabel;

    @Column(name = "product_summary", nullable = false, length = 255)
    private String productSummary;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Column(name = "total_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(nullable = false, length = 50)
    private String status = "PENDING_CONFIRMATION";

    @Column(name = "status_label", length = 100)
    private String statusLabel;

    @Column(name = "badge_class", length = 10)
    private String badgeClass;

    @Column(name = "action_text", length = 50)
    private String actionText;

    @Column(name = "action_style", length = 30)
    private String actionStyle;

    @Column(name = "next_action", length = 50)
    private String nextAction;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ShopOrder() {
    }
}
