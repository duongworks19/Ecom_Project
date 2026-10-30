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
    private String businessHours;
    private ShopStatus status;
    private BigDecimal ratingAvg;

    public static ShopResponse fromEntity(Shop shop) {
        if (shop == null) return null;
        ShopResponse res = new ShopResponse();
        res.setId(shop.getId());
        res.setName(shop.getName());
        res.setVendorId(shop.getVendor() != null ? shop.getVendor().getId() : null);
        String logo = shop.getLogo();
        if ((logo == null || logo.isBlank()) && shop.getVendor() != null && shop.getVendor().getKycDocumentUrl() != null) {
            String kyc = shop.getVendor().getKycDocumentUrl();
            if (kyc.contains("\"logo\"")) {
                try {
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(kyc);
                    if (node.has("logo") && !node.get("logo").asText().isBlank()) {
                        logo = node.get("logo").asText();
                    }
                } catch (Exception ignored) {}
            }
        }
        res.setLogo(logo);
        res.setBanner(shop.getBanner());
        res.setDescription(shop.getDescription());
        res.setPickupAddress(shop.getPickupAddress());
        res.setPhone(shop.getPhone());
        res.setEmail(shop.getEmail());
        res.setBusinessHours(shop.getBusinessHours());
        res.setStatus(shop.getStatus());
        res.setRatingAvg(shop.getRatingAvg());
        return res;
    }
}
