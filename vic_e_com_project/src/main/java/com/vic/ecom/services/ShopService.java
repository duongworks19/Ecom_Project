package com.vic.ecom.services;

import com.vic.ecom.dto.ShopDtos;
import com.vic.ecom.dto.VoucherDtos;
import com.vic.ecom.dto.seller.SellerProductDto;
import com.vic.ecom.dto.vendor.ShopResponse;
import com.vic.ecom.entity.Product;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.ShopReview;
import com.vic.ecom.entity.User;
import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.enums.VoucherStatus;
import com.vic.ecom.repository.ProductRepository;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.ShopReviewRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;
    private final ProductRepository productRepository;
    private final VoucherRepository voucherRepository;
    private final ShopReviewRepository shopReviewRepository;
    private final UserRepository userRepository;

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
        if (req.getLogo() != null && !req.getLogo().isBlank()) {
            shop.setLogo(req.getLogo().trim());
        }
        if (req.getBanner() != null && !req.getBanner().isBlank()) {
            shop.setBanner(req.getBanner().trim());
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
        return getActiveVouchersByShopId(shopId, false);
    }

    @Transactional(readOnly = true)
    public List<VoucherDtos.Response> getActiveVouchersByShopId(Long shopId, boolean includeWeb) {
        LocalDateTime now = LocalDateTime.now();

        List<Voucher> shopVouchers = new ArrayList<>();
        try {
            shopVouchers = voucherRepository.findByShopIdAndStatus(shopId, VoucherStatus.ACTIVE);
        } catch (Exception ignored) {
        }

        List<Voucher> combined = new ArrayList<>(shopVouchers);
        if (includeWeb) {
            try {
                ensureDefaultWebVouchers();
                List<Voucher> webVouchers = voucherRepository.findByShopIsNullAndStatus(VoucherStatus.ACTIVE);
                combined.addAll(webVouchers);
            } catch (Exception ignored) {
            }
        }

        return combined.stream()
                .filter(v -> (v.getStartAt() == null || !now.isBefore(v.getStartAt()))
                        && (v.getEndAt() == null || !now.isAfter(v.getEndAt()))
                        && (v.getUsageLimit() == null || v.getUsedCount() == null || v.getUsedCount() < v.getUsageLimit()))
                .map(v -> VoucherService.toResponse(v, now))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ShopDtos.FollowStatus getFollowStatus(Long shopId, Authentication auth) {
        Shop shop = shopRepository.findById(shopId).orElse(null);
        long count = (shop != null && shop.getFollowerCount() != null) ? shop.getFollowerCount() : 0L;
        return new ShopDtos.FollowStatus(false, count);
    }

    @Transactional
    public ShopDtos.FollowStatus toggleFollow(Long shopId, Authentication auth, Boolean isCurrentlyFollowing) {
        User user = resolveUser(auth);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập để theo dõi gian hàng");
        }
        Shop shop = shopRepository.findById(shopId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy gian hàng"));
        long count = shop.getFollowerCount() != null ? shop.getFollowerCount() : 0L;
        boolean isNowFollowing;
        if (Boolean.TRUE.equals(isCurrentlyFollowing)) {
            count = Math.max(0, count - 1);
            isNowFollowing = false;
        } else {
            count = count + 1;
            isNowFollowing = true;
        }
        shop.setFollowerCount(count);
        shopRepository.save(shop);
        return new ShopDtos.FollowStatus(isNowFollowing, count);
    }

    @Transactional(readOnly = true)
    public List<ShopDtos.ReviewItem> getShopReviews(Long shopId) {
        List<ShopReview> reviews = shopReviewRepository.findByShopIdAndTypeOrderByIdDesc(shopId, "REVIEW");
        if (reviews.isEmpty()) {
            reviews = shopReviewRepository.findByShopIdOrderByIdDesc(shopId).stream()
                    .filter(r -> !"QA".equalsIgnoreCase(r.getType()))
                    .collect(Collectors.toList());
        }
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        return reviews.stream()
                .filter(r -> !isSampleReview(r))
                .map(r -> {
                    String dateStr = r.getCreatedAtLabel();
                    if (dateStr == null || dateStr.isBlank()) {
                        dateStr = r.getCreatedAt() != null ? r.getCreatedAt().format(formatter) : "Gần đây";
                    }
                    String cName = r.getCustomerName();
                    if (cName == null || cName.isBlank()) {
                        cName = r.getCustomer() != null ? r.getCustomer().getFullName() : "Khách hàng";
                    }
                    return ShopDtos.ReviewItem.builder()
                            .id(r.getId())
                            .customerName(cName)
                            .productName(r.getProductName() != null ? r.getProductName() : "")
                            .productImage(r.getProductImage())
                            .rating(r.getRating() != null ? r.getRating() : 5)
                            .comment(r.getComment() != null ? r.getComment() : "")
                            .reply(r.getReply())
                            .createdAt(dateStr)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private boolean isSampleReview(ShopReview r) {
        if (r == null) return false;
        String name = r.getCustomerName();
        if (name != null) {
            if ("Nguyễn Ngọc Mai".equalsIgnoreCase(name) || "Hoàng Gia Bảo".equalsIgnoreCase(name)
                    || "Vũ Thanh Tâm".equalsIgnoreCase(name) || "Đặng Khánh Linh".equalsIgnoreCase(name)) {
                return true;
            }
        }
        String comment = r.getComment();
        if (comment != null) {
            if (comment.contains("đèn này dùng bóng đui xoáy") || comment.contains("Mùi lavender dịu nhẹ")
                    || comment.contains("Khung gỗ thật cầm nặng tay") || comment.contains("cắm cúc mẫu đơn rất hợp")) {
                return true;
            }
        }
        return false;
    }

    private User resolveUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equalsIgnoreCase(auth.getName())) {
            return null;
        }
        return userRepository.findByEmail(auth.getName())
                .or(() -> userRepository.findByPhone(auth.getName()))
                .orElse(null);
    }

    private void ensureDefaultWebVouchers() {
        try {
            if (voucherRepository.findByShopIsNullAndCodeIgnoreCase("VICMARTNEW").isEmpty()) {
                Voucher v = Voucher.builder()
                        .code("VICMARTNEW")
                        .discountType(com.vic.ecom.enums.VoucherDiscountType.FIXED)
                        .value(BigDecimal.valueOf(20000))
                        .minOrderAmount(BigDecimal.valueOf(150000))
                        .usageLimit(10000)
                        .usedCount(0)
                        .startAt(LocalDateTime.now().minusDays(1))
                        .endAt(LocalDateTime.now().plusMonths(6))
                        .status(VoucherStatus.ACTIVE)
                        .build();
                voucherRepository.save(v);
            }
            if (voucherRepository.findByShopIsNullAndCodeIgnoreCase("FREESHIP").isEmpty()) {
                Voucher v = Voucher.builder()
                        .code("FREESHIP")
                        .discountType(com.vic.ecom.enums.VoucherDiscountType.FIXED)
                        .value(BigDecimal.valueOf(30000))
                        .minOrderAmount(BigDecimal.valueOf(250000))
                        .usageLimit(10000)
                        .usedCount(0)
                        .startAt(LocalDateTime.now().minusDays(1))
                        .endAt(LocalDateTime.now().plusMonths(6))
                        .status(VoucherStatus.ACTIVE)
                        .build();
                voucherRepository.save(v);
            }
            if (voucherRepository.findByShopIsNullAndCodeIgnoreCase("VICMARTVIP").isEmpty()) {
                Voucher v = Voucher.builder()
                        .code("VICMARTVIP")
                        .discountType(com.vic.ecom.enums.VoucherDiscountType.PERCENT)
                        .value(BigDecimal.valueOf(10))
                        .maxDiscount(BigDecimal.valueOf(50000))
                        .minOrderAmount(BigDecimal.valueOf(300000))
                        .usageLimit(10000)
                        .usedCount(0)
                        .startAt(LocalDateTime.now().minusDays(1))
                        .endAt(LocalDateTime.now().plusMonths(6))
                        .status(VoucherStatus.ACTIVE)
                        .build();
                voucherRepository.save(v);
            }
        } catch (Exception ignored) {
        }
    }
}
