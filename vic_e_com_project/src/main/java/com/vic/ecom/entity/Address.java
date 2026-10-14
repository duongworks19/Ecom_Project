package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "addresses")
@Getter
@Setter
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "receiver_name", length = 100)
    private String receiverName;

    @Column(length = 15)
    private String phone;

    @Column(name = "address_detail", length = 500)
    private String addressDetail;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    public Address() {
    }
}
