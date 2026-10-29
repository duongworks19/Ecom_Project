package com.vic.ecom.dto.seller.product;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerProductUpdateRequest {

    @NotBlank(message = "Tên sản phẩm không được để trống")
    private String n;

    private String name;

    private String c;
    private String category;
    private Long categoryId;

    private String d;
    private String description;

    private String s;
    private String status;

    private String imageUrl;
    private List<SellerProductMediaDto> media = new ArrayList<>();

    @Builder.Default
    private List<SellerProductVariantDto> v = new ArrayList<>();

    private List<SellerProductVariantDto> variants;

    public String resolveName() {
        return (n != null && !n.isBlank()) ? n.trim() : (name != null ? name.trim() : "");
    }

    public String resolveCategory() {
        return (c != null && !c.isBlank()) ? c.trim() : (category != null ? category.trim() : "Nhà cửa & Đời sống");
    }

    public String resolveDescription() {
        return (d != null) ? d.trim() : (description != null ? description.trim() : "");
    }

    public String resolveStatus() {
        String val = (s != null && !s.isBlank()) ? s.trim().toUpperCase() : (status != null ? status.trim().toUpperCase() : "VISIBLE");
        if ("ĐANG BÁN".equals(val)) return "VISIBLE";
        if ("ĐÃ ẨN".equals(val)) return "HIDDEN";
        if ("NHÁP".equals(val)) return "DRAFT";
        return val;
    }

    public List<SellerProductVariantDto> resolveVariants() {
        if (v != null && !v.isEmpty()) return v;
        if (variants != null && !variants.isEmpty()) return variants;
        return List.of();
    }
}
