package com.vic.ecom.controller;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.SellerProductDto;
import com.vic.ecom.dto.vendor.ShopResponse;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.services.ShopService;
import com.vic.ecom.services.seller.product.SellerShopResolverService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shops")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;
    private final SellerShopResolverService shopResolverService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ShopResponse>>> getActiveShops() {
        List<ShopResponse> shops = shopService.getActiveShops();
        return ResponseEntity.ok(ApiResponse.ok("Danh sách gian hàng hoạt động", shops));
    }

    @GetMapping("/current")
    public ResponseEntity<ApiResponse<ShopResponse>> getCurrentShop(Authentication auth) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, null);
        if (shop == null) {
            return ResponseEntity.ok(ApiResponse.ok("Chưa có thông tin shop", null));
        }
        return ResponseEntity.ok(ApiResponse.ok("Thông tin shop hiện tại", ShopResponse.fromEntity(shop)));
    }

    @PutMapping("/current")
    public ResponseEntity<ApiResponse<ShopResponse>> updateCurrentShop(Authentication auth, @RequestBody com.vic.ecom.dto.vendor.UpdateShopRequest req) {
        Shop shop = shopResolverService.resolveCurrentShop(auth, null);
        if (shop == null) {
            return ResponseEntity.notFound().build();
        }
        shop = shopService.updateShop(shop, req);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin gian hàng thành công", ShopResponse.fromEntity(shop)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ShopResponse>> getShopById(@PathVariable Long id) {
        ShopResponse shop = shopService.getShopById(id);
        if (shop == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.ok("Thông tin gian hàng", shop));
    }

    @GetMapping("/{id}/products")
    public ResponseEntity<ApiResponse<List<SellerProductDto>>> getProductsByShopId(@PathVariable Long id) {
        List<SellerProductDto> products = shopService.getActiveProductsByShopId(id);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách sản phẩm của gian hàng", products));
    }

    @GetMapping("/{id}/vouchers")
    public ResponseEntity<ApiResponse<List<com.vic.ecom.dto.VoucherDtos.Response>>> getVouchersByShopId(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "false") boolean includeWeb) {
        List<com.vic.ecom.dto.VoucherDtos.Response> vouchers = shopService.getActiveVouchersByShopId(id, includeWeb);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách voucher hoạt động của gian hàng", vouchers));
    }

    @GetMapping("/{id}/follow-status")
    public ResponseEntity<ApiResponse<com.vic.ecom.dto.ShopDtos.FollowStatus>> getFollowStatus(
            @PathVariable Long id,
            Authentication auth) {
        com.vic.ecom.dto.ShopDtos.FollowStatus status = shopService.getFollowStatus(id, auth);
        return ResponseEntity.ok(ApiResponse.ok("Trạng thái theo dõi gian hàng", status));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<com.vic.ecom.dto.ShopDtos.FollowStatus>> toggleFollow(
            @PathVariable Long id,
            @RequestBody(required = false) java.util.Map<String, Object> body,
            Authentication auth) {
        Boolean isFollowing = null;
        if (body != null) {
            if (body.containsKey("isFollowing")) {
                isFollowing = (Boolean) body.get("isFollowing");
            } else if (body.containsKey("following")) {
                isFollowing = (Boolean) body.get("following");
            }
        }
        com.vic.ecom.dto.ShopDtos.FollowStatus status = shopService.toggleFollow(id, auth, isFollowing);
        return ResponseEntity.ok(ApiResponse.ok(status.isFollowing() ? "Theo dõi gian hàng thành công" : "Bỏ theo dõi gian hàng thành công", status));
    }

    @GetMapping("/{id}/reviews")
    public ResponseEntity<ApiResponse<List<com.vic.ecom.dto.ShopDtos.ReviewItem>>> getShopReviews(@PathVariable Long id) {
        List<com.vic.ecom.dto.ShopDtos.ReviewItem> reviews = shopService.getShopReviews(id);
        return ResponseEntity.ok(ApiResponse.ok("Danh sách đánh giá của gian hàng", reviews));
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
