package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Entity
@Table(name = "support_tickets")
@Getter @Setter
public class SupportTicket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "order_id", nullable = false)
    private Order order;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "customer_id", nullable = false)
    private User customer;
    @Column(nullable = false, length = 30) private String type;
    @Column(nullable = false, length = 255) private String subject;
    @Column(nullable = false, length = 30) private String status = "OPEN";
    @Column(name = "create_at", nullable = false) private LocalDateTime createdAt = LocalDateTime.now();
}
