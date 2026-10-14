package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SellerStockUpdateRequest {
    private Integer newQuantity;
    private Integer addQuantity;
}
