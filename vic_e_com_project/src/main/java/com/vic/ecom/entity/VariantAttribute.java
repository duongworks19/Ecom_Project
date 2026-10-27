package com.vic.ecom.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "variant_attributes")
@Getter
@Setter
public class VariantAttribute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "variant_id", nullable = false)
    private Long variantId;

    @Column(name = "attr_name", nullable = false, length = 50)
    private String attrName;

    @Column(name = "attr_value", nullable = false, length = 100)
    private String attrValue;
}
