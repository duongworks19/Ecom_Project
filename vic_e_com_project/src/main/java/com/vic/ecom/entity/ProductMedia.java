package com.vic.ecom.entity;

import com.vic.ecom.enums.ProductMediaType;
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

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProductMediaType type;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;
}
