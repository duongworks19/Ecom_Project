package com.vic.ecom.entity;

import com.vic.ecom.enums.ShipmentStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipment_events", indexes = @Index(name = "idx_shipment_events_shipment_created", columnList = "shipment_id, created_at"))
@Getter
@Setter
public class ShipmentEvent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shipment_id", nullable = false)
    private Shipment shipment;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private ShipmentStatus status;

    @Column(length = 500)
    private String note;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
