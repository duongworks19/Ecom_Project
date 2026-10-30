package com.vic.ecom.dto.search;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SearchProductItem {
    private Long id;
    private String name;
    private String category;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private Long shopId;
    private String shopName;
    private String shopLogo;
    private BigDecimal ratingAvg;
    private int soldCount;
}
