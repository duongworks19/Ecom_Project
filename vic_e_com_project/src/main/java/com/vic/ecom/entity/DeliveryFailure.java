package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "delivery_failures", indexes = @Index(name = "idx_delivery_failures_next_action", columnList = "next_action"))
@Getter
@Setter
public class DeliveryFailure {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Column(length = 500, nullable = false)
    private String reason;

    @Column(name = "attempt_no", nullable = false)
    private Integer attemptNo;

    @Column(name = "next_action", length = 20)
    private String nextAction;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
