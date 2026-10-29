package com.vic.ecom.dto.search;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class SearchResultResponse {
    private String query;
    private List<SearchShopItem> shops;
    private List<SearchProductItem> products;
}
