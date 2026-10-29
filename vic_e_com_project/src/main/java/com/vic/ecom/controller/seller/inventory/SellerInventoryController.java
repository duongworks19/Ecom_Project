package com.vic.ecom.controller.seller.inventory;

import com.vic.ecom.dto.ApiResponse;
import com.vic.ecom.dto.seller.SellerLowStockDto;
import com.vic.ecom.dto.seller.SellerStockUpdateRequest;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.services.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seller/inventory")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class SellerInventoryController {

    private final SellerDashboardService sellerDashboardService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SellerLowStockDto>>> getInventory(
            Authentication authentication
    ) {
        String principal = authentication != null ? authentication.getName() : null;
        Long userId = principal == null ? null : userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .map(User::getId)
                .orElse(null);
        List<SellerLowStockDto> inventory = sellerDashboardService.getInventory(userId);
        return ResponseEntity.ok(ApiResponse.ok("Dữ liệu kho hàng của người bán", inventory));
    }

    @PatchMapping("/{productId}/stock")
    public ResponseEntity<ApiResponse<SellerLowStockDto>> updateStock(
            @PathVariable Long productId,
            @RequestBody SellerStockUpdateRequest request
    ) {
        SellerLowStockDto result = sellerDashboardService.updateProductStock(productId, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật tồn kho thành công", result));
    }
}
