package com.vic.ecom.entity;

import com.vic.ecom.enums.ShipperWorkStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "shipper_profiles")
@Getter
@Setter
public class ShipperProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "vehicle_type", length = 50, nullable = false)
    private String vehicleType;

    @Column(name = "license_plate", length = 20, nullable = false)
    private String licensePlate;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_status", length = 20, nullable = false)
    private ShipperWorkStatus workStatus = ShipperWorkStatus.OFFLINE;

    @Column(name = "service_area", length = 255, nullable = false)
    private String serviceArea;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}
