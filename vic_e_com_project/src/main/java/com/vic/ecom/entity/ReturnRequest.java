package com.vic.ecom.entity;

import com.vic.ecom.enums.ReturnRequestStatus;
import com.vic.ecom.enums.ReturnRequestType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "return_requests")
@Getter
@Setter
public class ReturnRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ReturnRequestType type;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
    private ReturnRequestStatus status = ReturnRequestStatus.PENDING;

    @Column(name = "vendor_response", columnDefinition = "TEXT")
    private String vendorResponse;

    @Column(name = "refund_amount", precision = 12, scale = 2)
    private BigDecimal refundAmount = BigDecimal.ZERO;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    public ReturnRequest() {}
}
