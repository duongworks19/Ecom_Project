package com.vic.ecom.dto.seller.product;

import com.vic.ecom.enums.ProductMediaType;
import lombok.*;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class SellerProductMediaDto {
    private String url;
    private ProductMediaType type;
    private Integer sortOrder;
}
