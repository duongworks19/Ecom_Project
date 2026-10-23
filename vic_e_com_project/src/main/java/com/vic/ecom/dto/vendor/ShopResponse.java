package com.vic.ecom.dto.vendor;

import com.vic.ecom.entity.Shop;
import com.vic.ecom.enums.ShopStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class ShopResponse {
    private Long id;
    private Long vendorId;
    private String name;
    private String logo;
    private String banner;
    private String description;
    private String pickupAddress;
    private String phone;
    private String email;
    private ShopStatus status;
    private BigDecimal ratingAvg;

    public static ShopResponse fromEntity(Shop shop) {
        if (shop == null) return null;
        ShopResponse res = new ShopResponse();
        res.setId(shop.getId());
        res.setVendorId(shop.getVendor() != null ? shop.getVendor().getId() : null);
        res.setName(shop.getName());
        res.setLogo(shop.getLogo());
        res.setBanner(shop.getBanner());
        res.setDescription(shop.getDescription());
        res.setPickupAddress(shop.getPickupAddress());
        res.setPhone(shop.getPhone());
        res.setEmail(shop.getEmail());
        res.setStatus(shop.getStatus());
        res.setRatingAvg(shop.getRatingAvg());
        return res;
    }
}
