package com.vic.ecom.dto.search;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SearchShopItem {
    private Long id;
    private String name;
    private String logo;
    private String description;
    private String pickupAddress;
    private BigDecimal ratingAvg;
    private int productCount;
}
