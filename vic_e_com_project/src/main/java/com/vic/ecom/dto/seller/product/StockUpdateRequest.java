package com.vic.ecom.dto.seller.product;

import lombok.Data;

import java.util.List;

@Data
public class StockUpdateRequest {
    private String sku;
    private Integer q;
    private Integer stock;
    private Integer l;
    private Integer threshold;
    private List<SellerProductVariantDto> variants;
}
