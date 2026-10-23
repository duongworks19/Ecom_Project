package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(
        name = "product_variants",
        indexes = {
                @Index(name = "idx_variants_product_id", columnList = "product_id"),
                @Index(name = "idx_variants_sku", columnList = "sku")
        }
)
@Getter
@Setter
public class ProductVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(name = "variant_name", length = 100)
    private String variantName = "Mặc định";

    @Column(length = 50)
    private String sku;

    @Column(precision = 12, scale = 2, nullable = false)
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "stock_qty", nullable = false)
    private Integer stockQty = 0;

    @Column(name = "low_stock_threshold", nullable = false)
    private Integer lowStockThreshold = 5;

    @Column(name = "sold_count", nullable = false)
    private Integer soldCount = 0;

    @Column(name = "thumbnail_color", length = 30)
    private String thumbnailColor;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    public ProductVariant() {
    }
}
