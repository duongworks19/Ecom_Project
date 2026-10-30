package com.vic.ecom.entity;

import com.vic.ecom.enums.OrderStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "orders",
        indexes = {
                @Index(name = "idx_orders_customer_created_at", columnList = "customer_id, created_at"),
                @Index(name = "idx_orders_shop_id", columnList = "shop_id"),
                @Index(name = "idx_orders_code", columnList = "order_code")
        }
)
@Getter
@Setter
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_code", length = 50, unique = true)
    private String orderCode;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private User customer;

    @Column(name = "shop_id")
    private Long shopId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", insertable = false, updatable = false)
    private Shop shop;

    @Column(name = "checkout_group_id")
    private Long checkoutGroupId;

    @Column(name = "recipient_name", length = 100)
    private String receiverName;

    @Column(name = "recipient_phone", length = 15)
    private String receiverPhone;

    @Column(name = "recipient_address", length = 500)
    private String shippingAddress;

    @Column(name = "product_summary", length = 255)
    private String productSummary;

    @Column(name = "product_image", length = 500)
    private String productImage;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    @Column(name = "total_amount", precision = 12, scale = 2, nullable = false)
    private BigDecimal totalAmount = BigDecimal.ZERO;


    @Column(precision = 12, scale = 2)
    private BigDecimal subtotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee", precision = 12, scale = 2)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 12, scale = 2)
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "voucher_id")
    private Long voucherId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();


    @Column(name = "delivered_at")
    private LocalDateTime deliveredAt;

    @Column(name = "cancel_reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    private String rejectReason;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<Shipment> shipments = new ArrayList<>();

    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<ReturnRequest> returnRequests = new ArrayList<>();

    public Order() {
    }

    @PrePersist
    @PreUpdate
    private void syncCreatedAtColumns() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (totalAmount == null) totalAmount = BigDecimal.ZERO;
    }

    public void addItem(OrderItem item) {
        items.add(item);
        item.setOrder(this);
    }
}
