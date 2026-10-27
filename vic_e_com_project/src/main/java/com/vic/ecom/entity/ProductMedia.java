package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "product_media")
@Getter
@Setter
public class ProductMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false)
    private Long productId;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(nullable = false, length = 30)
    private String type;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
