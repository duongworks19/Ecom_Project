package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.vendor.ShopResponse;
import com.vic.ecom.services.ShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopResponse>>> getActiveShops() {
        List<ShopResponse> shops = shopService.getActiveShops();
        return ResponseEntity.ok(ApiResponse.ok("Danh sách gian hàng hoạt động", shops));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopResponse>> getShopById(@PathVariable Long id) {
        ShopResponse shop = shopService.getShopById(id);
        if (shop == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok("Thông tin gian hàng", shop));
    }

    @GetMapping("/by-vendor/{vendorId}")
    public ResponseEntity<ApiResponse<ShopResponse>> getShopByVendorId(@PathVariable Long vendorId) {
        ShopResponse shop = shopService.getShopByVendorId(vendorId);
        if (shop == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok("Thông tin gian hàng theo vendor", shop));
    }
}
