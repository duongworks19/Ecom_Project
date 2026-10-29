package com.vic.ecom.services;

import com.vic.ecom.dto.VoucherDtos;
import com.vic.ecom.dto.seller.SellerProductDto;
import com.vic.ecom.dto.vendor.ShopResponse;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.enums.VoucherStatus;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;

    @Transactional(readOnly = true)
    public ShopResponse getShopById(Long id) {
        return shopRepository.findById(id)
                .map(ShopResponse::fromEntity)
                .orElse(null);
    }

    @Transactional
    public Shop updateShop(Shop shop, com.vic.ecom.dto.vendor.UpdateShopRequest req) {
        if (shop == null || req == null) return shop;
        if (req.getName() != null && !req.getName().isBlank()) {
            shop.setName(req.getName().trim());
            if (shop.getVendor() != null) {
                shop.getVendor().setBusinessName(req.getName().trim());
            }
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            shop.setPhone(req.getPhone().trim());
        }
        if (req.getEmail() != null) {
            shop.setEmail(req.getEmail().trim());
        }
        if (req.getDescription() != null) {
            shop.setDescription(req.getDescription().trim());
        }
        if (req.getPickupAddress() != null && !req.getPickupAddress().isBlank()) {
            shop.setPickupAddress(req.getPickupAddress().trim());
        }
        if (req.getBusinessHours() != null) {
            shop.setBusinessHours(req.getBusinessHours().trim());
        }
        return shopRepository.save(shop);
    }

    @Transactional(readOnly = true)
    public ShopResponse getShopByVendorId(Long vendorId) {
        return shopRepository.findByVendorId(vendorId)
                .map(ShopResponse::fromEntity)
                .orElse(null);
    }

    @Transactional(readOnly = true)
    public List<ShopResponse> getActiveShops() {
        return shopRepository.findByStatus(ShopStatus.ACTIVE).stream()
                .map(ShopResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SellerProductDto> getActiveProductsByShopId(Long shopId) {
        List<Product> products = productRepository.findByShopIdAndStatusOrderByIdDesc(shopId, "VISIBLE");
        List<SellerProductDto> result = new ArrayList<>();
        for (Product p : products) {
            BigDecimal minPrice = BigDecimal.ZERO;
            int totalStock = 0;
            int totalSold = 0;
            String firstVariant = "Mặc định";
            String firstSku = "SP-" + p.getId();

            if (p.getVariants() != null && !p.getVariants().isEmpty()) {
                minPrice = p.getVariants().stream()
                        .map(v -> v.getPrice() != null ? v.getPrice() : BigDecimal.ZERO)
                        .filter(pr -> pr.compareTo(BigDecimal.ZERO) > 0)
                        .min(BigDecimal::compareTo)
                        .orElse(BigDecimal.ZERO);
                totalStock = p.getVariants().stream()
                        .mapToInt(v -> v.getStockQty() != null ? v.getStockQty() : 0)
                        .sum();
                totalSold = p.getVariants().stream()
                        .mapToInt(v -> v.getSoldCount() != null ? v.getSoldCount() : 0)
                        .sum();
                firstVariant = p.getVariants().get(0).getVariantName() != null ? p.getVariants().get(0).getVariantName() : "Mặc định";
                firstSku = p.getVariants().get(0).getSku() != null ? p.getVariants().get(0).getSku() : firstSku;
            }

            result.add(SellerProductDto.builder()
                    .id(p.getId())
                    .name(p.getName())
                    .variant(firstVariant)
                    .sku(firstSku)
                    .category(p.getCategory() != null ? p.getCategory() : "Thời trang & Phụ kiện")
                    .price(minPrice)
                    .stock(totalStock)
                    .soldCount(totalSold)
                    .thumbnailColor("#f3f4f6")
                    .imageUrl(p.getImageUrl() != null && !p.getImageUrl().isBlank() ? p.getImageUrl() : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80")
                    .status(totalStock <= 0 ? "LOW_STOCK" : "ACTIVE")
                    .build());
        }
        return result;
    }

    @Transactional(readOnly = true)
    public List<VoucherDtos.Response> getActiveVouchersByShopId(Long shopId) {
        LocalDateTime now = LocalDateTime.now();
        List<Voucher> vouchers = voucherRepository.findByShopIdAndStatus(shopId, VoucherStatus.ACTIVE);
        return vouchers.stream()
                .filter(v -> (v.getStartAt() == null || !now.isBefore(v.getStartAt()))
                        && (v.getEndAt() == null || !now.isAfter(v.getEndAt()))
                        && (v.getUsageLimit() == null || v.getUsedCount() == null || v.getUsedCount() < v.getUsageLimit()))
                .map(v -> VoucherService.toResponse(v, now))
                .collect(Collectors.toList());
    }
}
