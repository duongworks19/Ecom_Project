package com.vic.ecom.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
public class PublicProductDetail {
    private Long id;
    private String name;
    private String category;
    private String description;
    private String imageUrl;
    private List<ProductMediaDtos.Item> media;
    private BigDecimal price;
    private Integer stock;
    private Integer soldCount;
    private Long shopId;
    private String shopName;
    private BigDecimal ratingAvg;
    private List<ProductVariantDtos.Item> variants;
}
