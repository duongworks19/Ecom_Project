package com.vic.ecom.services;

import com.vic.ecom.dto.seller.*;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.ApprovalStatus;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SellerDashboardService {

    private static final String IMG_LAMP_CLOUD =
            "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80";
    private static final String IMG_OAK_FRAME =
            "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80";
    private static final String IMG_GLASS_VASE =
            "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=300&q=80";
    private static final String IMG_LAVENDER_CANDLE =
            "https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=300&q=80";
    private static final String IMG_NORDIC_MIRROR =
            "https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=300&q=80";
    private static final String IMG_CERAMIC_TRAY =
            "https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80";

    private final ShopRepository shopRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;
    private final ShopProductRepository shopProductRepository;
    private final ShopOrderRepository shopOrderRepository;
    private final ShopVoucherRepository shopVoucherRepository;
    private final ShopPromotionRepository shopPromotionRepository;
    private final ShopReviewRepository shopReviewRepository;

    @Transactional
    public Shop getOrCreateInitializedShop(Long userId) {
        Shop shop = null;
        if (userId != null) {
            Optional<Vendor> vendorOpt = vendorRepository.findByUserId(userId);
            if (vendorOpt.isPresent()) {
                shop = vendorOpt.get().getShop();
            }
        }
        if (shop == null) {
            List<Shop> existingShops = shopRepository.findAll();
            if (!existingShops.isEmpty()) {
                shop = existingShops.get(0);
            }
        }
        if (shop == null) {
            User sellerUser = userRepository.findByEmail("seller@lumihomedecor.vn")
                    .orElseGet(() -> {
                        User u = new User();
                        u.setEmail("seller@lumihomedecor.vn");
                        u.setFullName("Lumi Home Decor Owner");
                        u.setPhone("0987654321");
                        u.setRole(UserRole.VENDOR);
                        u.setStatus(UserStatus.ACTIVE);
                        u.setAuthProvider("LOCAL");
                        return userRepository.save(u);
                    });

            Vendor vendor = vendorRepository.findByUserId(sellerUser.getId())
                    .orElseGet(() -> {
                        Vendor v = new Vendor();
                        v.setUser(sellerUser);
                        v.setBusinessName("Lumi Home Decor Co., Ltd.");
                        v.setApprovalStatus(ApprovalStatus.APPROVED);
                        return vendorRepository.save(v);
                    });

            Shop newShop = new Shop();
            newShop.setVendor(vendor);
            newShop.setName("Lumi Home Decor");
            newShop.setTagline("Minimalist & Cozy Scandinavian Living");
            newShop.setDescription("Chuyên phụ kiện trang trí nhà cửa phong cách Bắc Âu tối giản: đèn gốm thủ công, nến thơm tinh dầu thiên nhiên, bình hoa thủy tinh và khung tranh gỗ sồi tự nhiên.");
            newShop.setPhone("0987 654 321");
            newShop.setEmail("hello@lumihomedecor.vn");
            newShop.setPickupAddress("Số 45 Ngõ 82 Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội");
            newShop.setBusinessHours("08:30 - 21:00 (Thứ 2 - Chủ Nhật)");
            newShop.setStatus(ShopStatus.ACTIVE);
            newShop.setRatingAvg(BigDecimal.valueOf(4.8));
            shop = shopRepository.save(newShop);
        } else {
            boolean updated = false;
            if (shop.getTagline() == null) {
                shop.setTagline("Minimalist & Cozy Scandinavian Living");
                updated = true;
            }
            if (shop.getDescription() == null) {
                shop.setDescription("Chuyên phụ kiện trang trí nhà cửa phong cách Bắc Âu tối giản: đèn gốm thủ công, nến thơm tinh dầu thiên nhiên, bình hoa thủy tinh và khung tranh gỗ sồi tự nhiên.");
                updated = true;
            }
            if (shop.getPhone() == null) {
                shop.setPhone("0987 654 321");
                updated = true;
            }
            if (shop.getEmail() == null) {
                shop.setEmail("hello@lumihomedecor.vn");
                updated = true;
            }
            if (shop.getPickupAddress() == null) {
                shop.setPickupAddress("Số 45 Ngõ 82 Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội");
                updated = true;
            }
            if (shop.getBusinessHours() == null) {
                shop.setBusinessHours("08:30 - 21:00 (Thứ 2 - Chủ Nhật)");
                updated = true;
            }
            if (updated) {
                shop = shopRepository.save(shop);
            }
        }

        seedShopDataIfNeeded(shop);
        return shop;
    }

    private void seedShopDataIfNeeded(Shop shop) {
        Long shopId = shop.getId();

        if (shopProductRepository.findByShopIdOrderByIdDesc(shopId).isEmpty()) {
            List<ShopProduct> initialProducts = List.of(
                    buildProduct(shop, "Đèn ngủ gốm Cloud", "Màu kem", "LM-021", "Đèn trang trí", BigDecimal.valueOf(420000), 2, 84, "#f3c7c0", IMG_LAMP_CLOUD),
                    buildProduct(shop, "Khung tranh gỗ sồi A4", "Size A4", "LM-044", "Khung & Tranh", BigDecimal.valueOf(190000), 3, 142, "#d9d2c6", IMG_OAK_FRAME),
                    buildProduct(shop, "Bình hoa thủy tinh", "Xanh sage", "LM-007", "Lọ & Bình hoa", BigDecimal.valueOf(159000), 6, 215, "#c8d9c9", IMG_GLASS_VASE),
                    buildProduct(shop, "Nến thơm Lavender", "200g", "LM-063", "Nến & Tinh dầu", BigDecimal.valueOf(89000), 8, 310, "#c9d3e0", IMG_LAVENDER_CANDLE),
                    buildProduct(shop, "Gương để bàn lượn sóng Bắc Âu", "Trắng kem", "LM-088", "Gương decor", BigDecimal.valueOf(285000), 34, 96, "#e8dfd5", IMG_NORDIC_MIRROR),
                    buildProduct(shop, "Khay gốm sứ đựng trang sức Monstera", "Trắng ngà", "LM-052", "Phụ kiện bàn", BigDecimal.valueOf(135000), 42, 178, "#dce5df", IMG_CERAMIC_TRAY)
            );
            shopProductRepository.saveAll(initialProducts);
        }

        if (shopOrderRepository.findByShopIdOrderByIdDesc(shopId).isEmpty()) {
            List<ShopOrder> initialOrders = List.of(
                    buildOrder(shop, "#VM240918", "Nguyễn Thu Hà", "0912 345 678", "188 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội", "14/10/2026 09:12", "Đèn ngủ gốm Cloud ×1", IMG_LAMP_CLOUD, BigDecimal.valueOf(420000), "PENDING_CONFIRMATION", "Chờ xác nhận", "w", "Xác nhận", "red", "CONFIRM"),
                    buildOrder(shop, "#VM240917", "Trần Minh Quân", "0988 765 432", "72 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội", "14/10/2026 08:45", "Nến thơm Lavender ×3", IMG_LAVENDER_CANDLE, BigDecimal.valueOf(267000), "PENDING_CONFIRMATION", "Chờ xác nhận", "w", "Xác nhận", "red", "CONFIRM"),
                    buildOrder(shop, "#VM240915", "Lê Phương Anh", "0904 112 233", "Tòa S2 Vinhomes Skylake, Phạm Hùng, Nam Từ Liêm, Hà Nội", "14/10/2026 07:30", "Khung tranh gỗ sồi A4 ×2", IMG_OAK_FRAME, BigDecimal.valueOf(380000), "PREPARING", "Đang chuẩn bị", "o", "Đã đóng gói", "outline", "MARK_PACKED"),
                    buildOrder(shop, "#VM240912", "Phạm Đức Long", "0936 998 877", "25 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội", "13/10/2026 21:15", "Bình hoa thủy tinh ×1", IMG_GLASS_VASE, BigDecimal.valueOf(159000), "REFUND_REQUEST", "Hoàn tiền", "r", "Xem xét", "outline", "REVIEW_REFUND")
            );
            shopOrderRepository.saveAll(initialOrders);
        }

        if (shopVoucherRepository.findByShopIdOrderByIdDesc(shopId).isEmpty()) {
            List<ShopVoucher> initialVouchers = List.of(
                    buildVoucher(shop, "LUMI20K", "Giảm 20.000đ cho đơn từ 199K", "20.000đ", BigDecimal.valueOf(199000), 42, 100, "31/10/2026", true),
                    buildVoucher(shop, "LUMINEW10", "Giảm 10% khách hàng mới theo dõi shop", "10%", BigDecimal.valueOf(150000), 68, 200, "15/11/2026", true)
            );
            shopVoucherRepository.saveAll(initialVouchers);
        }

        if (shopPromotionRepository.findByShopIdOrderByIdDesc(shopId).isEmpty()) {
            List<ShopPromotion> initialPromotions = List.of(
                    buildPromotion(shop, "Flash Sale Góc Nhỏ Ấm Cúng — Tháng 10", 25, 4, "14/10/2026 - 20/10/2026", "RUNNING"),
                    buildPromotion(shop, "Combo Nến Thơm & Bình Hoa Thu Đông", 15, 3, "25/10/2026 - 05/11/2026", "UPCOMING")
            );
            shopPromotionRepository.saveAll(initialPromotions);
        }

        if (shopReviewRepository.findByShopIdOrderByIdDesc(shopId).isEmpty()) {
            User defaultCustomer = userRepository.findAll().stream()
                    .findFirst()
                    .orElseGet(() -> shop.getVendor().getUser());
            List<ShopReview> initialReviews = List.of(
                    buildReview(shop, defaultCustomer, "Nguyễn Ngọc Mai", "Đèn ngủ gốm Cloud", IMG_LAMP_CLOUD, 5, "Shop ơi đèn này dùng bóng đui xoáy E27 hay bóng LED tích hợp sẵn vậy ạ?", "15 phút trước", null),
                    buildReview(shop, defaultCustomer, "Hoàng Gia Bảo", "Nến thơm Lavender", IMG_LAVENDER_CANDLE, 5, "Mùi lavender dịu nhẹ rất thư giãn, đóng gói chống sốc cực kỳ cẩn thận. Cho mình hỏi hũ 200g đốt được khoảng bao nhiêu giờ?", "1 giờ trước", null),
                    buildReview(shop, defaultCustomer, "Vũ Thanh Tâm", "Khung tranh gỗ sồi A4", IMG_OAK_FRAME, 4, "Khung gỗ thật cầm nặng tay, shop có kèm đinh 3 chân treo tường không ạ?", "3 giờ trước", null),
                    buildReview(shop, defaultCustomer, "Đặng Khánh Linh", "Bình hoa thủy tinh", IMG_GLASS_VASE, 5, "Màu xanh sage ở ngoài đẹp hơn trong ảnh nữa, cắm cúc mẫu đơn rất hợp!", "Hôm qua", "Lumi Home Decor cảm ơn bạn Khánh Linh rất nhiều ạ! Chúc bạn luôn có không gian sống thật xinh nhé ❤️")
            );
            shopReviewRepository.saveAll(initialReviews);
        }
    }

    private ShopProduct buildProduct(Shop shop, String name, String variant, String sku, String category, BigDecimal price, int stock, int soldCount, String color, String imageUrl) {
        ShopProduct p = new ShopProduct();
        p.setShop(shop);
        p.setName(name);
        p.setVariant(variant);
        p.setSku(sku);
        p.setCategory(category);
        p.setPrice(price);
        p.setStock(stock);
        p.setSoldCount(soldCount);
        p.setThumbnailColor(color);
        p.setImageUrl(imageUrl);
        p.setStatus(stock <= 10 ? "LOW_STOCK" : "ACTIVE");
        return p;
    }

    private ShopOrder buildOrder(Shop shop, String code, String customerName, String phone, String address, String createdAtLabel, String summary, String image, BigDecimal amount, String status, String statusLabel, String badgeClass, String actionText, String actionStyle, String nextAction) {
        ShopOrder o = new ShopOrder();
        o.setShop(shop);
        o.setOrderCode(code);
        o.setCustomerName(customerName);
        o.setCustomerPhone(phone);
        o.setShippingAddress(address);
        o.setCreatedAtLabel(createdAtLabel);
        o.setProductSummary(summary);
        o.setProductImage(image);
        o.setTotalAmount(amount);
        o.setStatus(status);
        o.setStatusLabel(statusLabel);
        o.setBadgeClass(badgeClass);
        o.setActionText(actionText);
        o.setActionStyle(actionStyle);
        o.setNextAction(nextAction);
        return o;
    }

    private ShopVoucher buildVoucher(Shop shop, String code, String title, String discountText, BigDecimal minOrderAmount, int usedCount, int totalQuota, String expiryDate, boolean active) {
        ShopVoucher v = new ShopVoucher();
        v.setShop(shop);
        v.setCode(code);
        v.setTitle(title);
        v.setDiscountText(discountText);
        v.setMinOrderAmount(minOrderAmount);
        v.setUsedCount(usedCount);
        v.setTotalQuota(totalQuota);
        v.setExpiryDate(expiryDate);
        v.setActive(active);
        return v;
    }

    private ShopPromotion buildPromotion(Shop shop, String name, int discountPercent, int productCount, String timeRange, String status) {
        ShopPromotion pr = new ShopPromotion();
        pr.setShop(shop);
        pr.setName(name);
        pr.setDiscountPercent(discountPercent);
        pr.setProductCount(productCount);
        pr.setTimeRange(timeRange);
        pr.setStatus(status);
        return pr;
    }

    private ShopReview buildReview(Shop shop, User customer, String customerName, String productName, String productImage, int rating, String comment, String createdAtLabel, String reply) {
        ShopReview r = new ShopReview();
        r.setShop(shop);
        r.setCustomer(customer);
        r.setCustomerName(customerName);
        r.setProductName(productName);
        r.setProductImage(productImage);
        r.setRating(rating);
        r.setComment(comment);
        r.setCreatedAtLabel(createdAtLabel);
        r.setReply(reply);
        return r;
    }

    @Transactional
    public SellerDashboardResponse getDashboardData(Long userId) {
        Shop shop = getOrCreateInitializedShop(userId);
        Long shopId = shop.getId();

        String shopName = (shop.getName() != null && !shop.getName().isBlank()) ? shop.getName() : "Lumi Home Decor";
        String avatarLetter = shopName.substring(0, 1).toUpperCase();
        String logo = shop.getLogo();
        boolean isApproved = shop.getStatus() == ShopStatus.ACTIVE;

        List<ShopProduct> dbProducts = shopProductRepository.findByShopIdOrderByIdDesc(shopId);
        List<ShopOrder> dbOrders = shopOrderRepository.findByShopIdOrderByIdDesc(shopId);
        List<ShopVoucher> dbVouchers = shopVoucherRepository.findByShopIdOrderByIdDesc(shopId);
        List<ShopPromotion> dbPromotions = shopPromotionRepository.findByShopIdOrderByIdDesc(shopId);
        List<ShopReview> dbReviews = shopReviewRepository.findByShopIdOrderByIdDesc(shopId);

        List<SellerProductDto> products = dbProducts.stream()
                .map(this::toProductDto)
                .collect(Collectors.toList());

        List<SellerLowStockDto> lowStock = dbProducts.stream()
                .filter(p -> p.getStock() != null && p.getStock() <= 10)
                .map(this::toLowStockDto)
                .collect(Collectors.toList());

        List<SellerRecentOrderDto> recentOrders = dbOrders.stream()
                .map(this::toOrderDto)
                .collect(Collectors.toList());

        List<SellerVoucherDto> vouchers = dbVouchers.stream()
                .map(this::toVoucherDto)
                .collect(Collectors.toList());

        List<SellerPromotionDto> promotions = dbPromotions.stream()
                .map(this::toPromotionDto)
                .collect(Collectors.toList());

        List<SellerReviewQuestionDto> reviews = dbReviews.stream()
                .map(this::toReviewDto)
                .collect(Collectors.toList());

        SellerShopProfileDto shopProfile = SellerShopProfileDto.builder()
                .shopName(shopName)
                .tagline(shop.getTagline() != null ? shop.getTagline() : "Minimalist & Cozy Scandinavian Living")
                .description(shop.getDescription() != null ? shop.getDescription() : "")
                .phone(shop.getPhone() != null ? shop.getPhone() : "0987 654 321")
                .email(shop.getEmail() != null ? shop.getEmail() : "hello@lumihomedecor.vn")
                .pickupAddress(shop.getPickupAddress() != null ? shop.getPickupAddress() : "")
                .businessHours(shop.getBusinessHours() != null ? shop.getBusinessHours() : "08:30 - 21:00 (Thứ 2 - Chủ Nhật)")
                .build();

        int pendingConfirmCount = (int) dbOrders.stream().filter(o -> "PENDING_CONFIRMATION".equals(o.getStatus())).count();
        int preparingCount = (int) dbOrders.stream().filter(o -> "PREPARING".equals(o.getStatus())).count();
        int refundCount = (int) dbOrders.stream().filter(o -> "REFUND_REQUEST".equals(o.getStatus()) || "IN_REVIEW".equals(o.getStatus())).count();
        int unansweredReviewCount = (int) dbReviews.stream().filter(r -> r.getReply() == null || r.getReply().isBlank()).count();

        SellerDashboardStatsDto stats = SellerDashboardStatsDto.builder()
                .todayRevenue(BigDecimal.valueOf(4820000))
                .revenueGrowthPercent(12.0)
                .totalOrdersToday(23)
                .orderGrowthCount(4)
                .cancellationRate(2.1)
                .cancellationRateDiff(0.4)
                .averageRating(shop.getRatingAvg() != null && shop.getRatingAvg().compareTo(BigDecimal.ZERO) > 0 ? shop.getRatingAvg() : BigDecimal.valueOf(4.8))
                .totalReviews(Math.max(128, dbReviews.size()))
                .build();

        SellerTodoDto todos = SellerTodoDto.builder()
                .pendingConfirmationOrders(pendingConfirmCount)
                .pendingPackagingOrders(preparingCount)
                .refundRequests(refundCount)
                .lowStockAlerts(lowStock.size())
                .unansweredQuestions(unansweredReviewCount)
                .build();

        List<SellerRevenuePointDto> chart7Days = List.of(
                new SellerRevenuePointDto("T5", 2.1, BigDecimal.valueOf(2100000), 11),
                new SellerRevenuePointDto("T6", 3.4, BigDecimal.valueOf(3400000), 16),
                new SellerRevenuePointDto("T7", 2.8, BigDecimal.valueOf(2800000), 14),
                new SellerRevenuePointDto("CN", 4.1, BigDecimal.valueOf(4100000), 20),
                new SellerRevenuePointDto("T2", 3.6, BigDecimal.valueOf(3600000), 18),
                new SellerRevenuePointDto("T3", 4.3, BigDecimal.valueOf(4300000), 21),
                new SellerRevenuePointDto("T4", 4.8, BigDecimal.valueOf(4820000), 23)
        );

        double[] vals30 = {1.8, 2.2, 2.0, 2.9, 3.1, 2.7, 3.3, 3.0, 2.6, 3.5, 3.8, 3.2, 3.9, 4.1, 3.7, 3.4, 4.0, 4.4, 3.9, 4.2, 4.6, 4.1, 3.8, 4.5, 4.7, 4.3, 4.9, 4.4, 4.1, 4.8};
        List<SellerRevenuePointDto> chart30Days = new ArrayList<>();
        for (int i = 0; i < vals30.length; i++) {
            chart30Days.add(new SellerRevenuePointDto(
                    String.valueOf(i + 1),
                    vals30[i],
                    BigDecimal.valueOf((long) (vals30[i] * 1_000_000)),
                    (int) (vals30[i] * 5)
            ));
        }

        int urgentTasks = pendingConfirmCount + preparingCount + refundCount + lowStock.size();
        int completedSteps = 2 + (dbProducts.size() > 6 ? 1 : 0) + (dbVouchers.size() > 2 ? 1 : 0);

        return SellerDashboardResponse.builder()
                .shopId(shopId)
                .shopName(shopName)
                .shopAvatarLetter(avatarLetter)
                .shopLogo(logo)
                .adminApproved(isApproved)
                .greetingTitle("Chào " + shopName.split(" ")[0] + ", hôm nay có " + urgentTasks + " việc cần xử lý")
                .currentDateText("Thứ Tư, 14/10/2026 · Xử lý đơn mới trước 17:00 để giao trong ngày.")
                .totalUrgentTasks(urgentTasks)
                .unreadNotifications(6)
                .completedSteps(completedSteps)
                .totalSteps(4)
                .stats(stats)
                .todos(todos)
                .revenueChart7Days(chart7Days)
                .revenueChart30Days(chart30Days)
                .lowStockProducts(lowStock)
                .recentOrders(recentOrders)
                .products(products)
                .vouchers(vouchers)
                .promotions(promotions)
                .reviews(reviews)
                .shopProfile(shopProfile)
                .build();
    }

    @Transactional
    public SellerRecentOrderDto handleQuickAction(String orderCode, OrderQuickActionRequest request) {
        Shop shop = getOrCreateInitializedShop(null);
        String action = request.getAction() != null ? request.getAction() : "";

        Optional<ShopOrder> orderOpt = shopOrderRepository.findByOrderCode(orderCode);
        if (orderOpt.isEmpty() && !orderCode.startsWith("#")) {
            orderOpt = shopOrderRepository.findByOrderCode("#" + orderCode);
        }

        ShopOrder order = orderOpt.orElseGet(() -> {
            ShopOrder newOrder = new ShopOrder();
            newOrder.setShop(shop);
            newOrder.setOrderCode(orderCode);
            newOrder.setCustomerName("Khách hàng");
            newOrder.setProductSummary("Sản phẩm");
            newOrder.setTotalAmount(BigDecimal.ZERO);
            return newOrder;
        });

        if ("CONFIRM".equalsIgnoreCase(action)) {
            order.setStatus("PREPARING");
            order.setStatusLabel("Đang chuẩn bị");
            order.setBadgeClass("o");
            order.setActionText("Đã đóng gói");
            order.setActionStyle("outline");
            order.setNextAction("MARK_PACKED");
        } else if ("MARK_PACKED".equalsIgnoreCase(action)) {
            order.setStatus("PACKED");
            order.setStatusLabel("Chờ lấy hàng");
            order.setBadgeClass("o");
            order.setActionText("Chi tiết");
            order.setActionStyle("outline");
            order.setNextAction("VIEW_DETAIL");
        } else if ("REVIEW_REFUND".equalsIgnoreCase(action)) {
            order.setStatus("IN_REVIEW");
            order.setStatusLabel("Đang xem xét");
            order.setBadgeClass("w");
            order.setActionText("Duyệt hoàn");
            order.setActionStyle("red");
            order.setNextAction("APPROVE_REFUND");
        } else if ("APPROVE_REFUND".equalsIgnoreCase(action)) {
            order.setStatus("COMPLETED");
            order.setStatusLabel("Đã hoàn tiền");
            order.setBadgeClass("o");
            order.setActionText("Chi tiết");
            order.setActionStyle("outline");
            order.setNextAction("VIEW_DETAIL");
        } else {
            order.setStatus("IN_REVIEW");
            order.setStatusLabel("Đang xem xét");
            order.setBadgeClass("w");
            order.setActionText("Chi tiết");
            order.setActionStyle("outline");
            order.setNextAction("VIEW_DETAIL");
        }

        ShopOrder saved = shopOrderRepository.save(order);
        return toOrderDto(saved);
    }

    @Transactional
    public SellerLowStockDto updateProductStock(Long productId, SellerStockUpdateRequest request) {
        Shop shop = getOrCreateInitializedShop(null);
        Optional<ShopProduct> productOpt = shopProductRepository.findById(productId);

        if (productOpt.isPresent()) {
            ShopProduct product = productOpt.get();
            int currentStock = product.getStock() != null ? product.getStock() : 0;
            int updatedQty;
            if (request.getNewQuantity() != null) {
                updatedQty = request.getNewQuantity();
            } else if (request.getAddQuantity() != null) {
                updatedQty = currentStock + request.getAddQuantity();
            } else {
                updatedQty = currentStock + 20;
            }
            product.setStock(updatedQty);
            product.setStatus(updatedQty <= 10 ? "LOW_STOCK" : "ACTIVE");
            ShopProduct saved = shopProductRepository.save(product);
            return toLowStockDto(saved);
        }

        int fallbackQty = request.getNewQuantity() != null ? request.getNewQuantity() : 20;
        return SellerLowStockDto.builder()
                .id(productId)
                .remainingQuantity(fallbackQty)
                .badgeType(fallbackQty < 5 ? "danger" : "warning")
                .build();
    }

    @Transactional
    public SellerProductDto createProduct(SellerProductDto request) {
        Shop shop = getOrCreateInitializedShop(null);

        ShopProduct product = new ShopProduct();
        product.setShop(shop);
        product.setName(request.getName() != null ? request.getName().trim() : "Sản phẩm mới");
        product.setVariant(request.getVariant() != null && !request.getVariant().isBlank() ? request.getVariant().trim() : "Tiêu chuẩn");
        product.setSku(request.getSku() != null && !request.getSku().isBlank()
                ? request.getSku().trim().toUpperCase()
                : "LM-" + (100 + new Random().nextInt(900)));
        product.setCategory(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : "Đèn trang trí");
        product.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.valueOf(150000));
        int stock = request.getStock() != null ? request.getStock() : 20;
        product.setStock(stock);
        product.setSoldCount(request.getSoldCount() != null ? request.getSoldCount() : 0);
        product.setThumbnailColor(request.getThumbnailColor() != null && !request.getThumbnailColor().isBlank()
                ? request.getThumbnailColor()
                : "#f3c7c0");
        product.setImageUrl(request.getImageUrl() != null && !request.getImageUrl().isBlank()
                ? request.getImageUrl()
                : IMG_LAMP_CLOUD);
        product.setStatus(stock <= 10 ? "LOW_STOCK" : "ACTIVE");

        ShopProduct saved = shopProductRepository.save(product);
        return toProductDto(saved);
    }

    @Transactional
    public SellerVoucherDto createVoucher(SellerVoucherDto request) {
        Shop shop = getOrCreateInitializedShop(null);

        ShopVoucher voucher = new ShopVoucher();
        voucher.setShop(shop);
        voucher.setCode(request.getCode() != null ? request.getCode().trim().toUpperCase() : "LUMISALE");
        voucher.setTitle(request.getTitle() != null ? request.getTitle().trim() : "Voucher ưu đãi gian hàng");
        voucher.setDiscountText(request.getDiscountText() != null ? request.getDiscountText().trim() : "20.000đ");
        voucher.setMinOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.valueOf(100000));
        voucher.setUsedCount(0);
        voucher.setTotalQuota(request.getTotalQuota() != null ? request.getTotalQuota() : 50);
        voucher.setExpiryDate(request.getExpiryDate() != null && !request.getExpiryDate().isBlank() ? request.getExpiryDate() : "30/11/2026");
        voucher.setActive(true);

        ShopVoucher saved = shopVoucherRepository.save(voucher);
        return toVoucherDto(saved);
    }

    @Transactional
    public SellerVoucherDto toggleVoucherStatus(Long voucherId) {
        ShopVoucher voucher = shopVoucherRepository.findById(voucherId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy voucher với id: " + voucherId));
        voucher.setActive(!Boolean.TRUE.equals(voucher.getActive()));
        ShopVoucher saved = shopVoucherRepository.save(voucher);
        return toVoucherDto(saved);
    }

    @Transactional
    public SellerReviewQuestionDto replyReview(Long reviewId, String replyText) {
        ShopReview review = shopReviewRepository.findById(reviewId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đánh giá/câu hỏi với id: " + reviewId));
        review.setReply(replyText != null ? replyText.trim() : "");
        ShopReview saved = shopReviewRepository.save(review);
        return toReviewDto(saved);
    }

    @Transactional
    public SellerShopProfileDto updateShopProfile(SellerShopProfileDto request) {
        Shop shop = getOrCreateInitializedShop(null);
        if (request.getShopName() != null && !request.getShopName().isBlank()) {
            shop.setName(request.getShopName().trim());
        }
        if (request.getTagline() != null) {
            shop.setTagline(request.getTagline().trim());
        }
        if (request.getDescription() != null) {
            shop.setDescription(request.getDescription().trim());
        }
        if (request.getPhone() != null) {
            shop.setPhone(request.getPhone().trim());
        }
        if (request.getEmail() != null) {
            shop.setEmail(request.getEmail().trim());
        }
        if (request.getPickupAddress() != null) {
            shop.setPickupAddress(request.getPickupAddress().trim());
        }
        if (request.getBusinessHours() != null) {
            shop.setBusinessHours(request.getBusinessHours().trim());
        }
        Shop saved = shopRepository.save(shop);
        return SellerShopProfileDto.builder()
                .shopName(saved.getName())
                .tagline(saved.getTagline())
                .description(saved.getDescription())
                .phone(saved.getPhone())
                .email(saved.getEmail())
                .pickupAddress(saved.getPickupAddress())
                .businessHours(saved.getBusinessHours())
                .build();
    }

    private SellerProductDto toProductDto(ShopProduct p) {
        return SellerProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .variant(p.getVariant())
                .sku(p.getSku())
                .category(p.getCategory())
                .price(p.getPrice())
                .stock(p.getStock())
                .soldCount(p.getSoldCount())
                .thumbnailColor(p.getThumbnailColor())
                .imageUrl(p.getImageUrl())
                .status(p.getStatus())
                .build();
    }

    private SellerLowStockDto toLowStockDto(ShopProduct p) {
        int stock = p.getStock() != null ? p.getStock() : 0;
        return SellerLowStockDto.builder()
                .id(p.getId())
                .name(p.getName())
                .variant(p.getVariant())
                .sku(p.getSku())
                .remainingQuantity(stock)
                .thumbnailColor(p.getThumbnailColor())
                .imageUrl(p.getImageUrl())
                .badgeType(stock < 5 ? "danger" : "warning")
                .build();
    }

    private SellerRecentOrderDto toOrderDto(ShopOrder o) {
        return SellerRecentOrderDto.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .customerName(o.getCustomerName())
                .customerPhone(o.getCustomerPhone())
                .shippingAddress(o.getShippingAddress())
                .createdAt(o.getCreatedAtLabel())
                .productSummary(o.getProductSummary())
                .productImage(o.getProductImage())
                .totalAmount(o.getTotalAmount())
                .status(o.getStatus())
                .statusLabel(o.getStatusLabel())
                .badgeClass(o.getBadgeClass())
                .actionText(o.getActionText())
                .actionStyle(o.getActionStyle())
                .nextAction(o.getNextAction())
                .build();
    }

    private SellerVoucherDto toVoucherDto(ShopVoucher v) {
        return SellerVoucherDto.builder()
                .id(v.getId())
                .code(v.getCode())
                .title(v.getTitle())
                .discountText(v.getDiscountText())
                .minOrderAmount(v.getMinOrderAmount())
                .usedCount(v.getUsedCount())
                .totalQuota(v.getTotalQuota())
                .expiryDate(v.getExpiryDate())
                .active(v.getActive())
                .build();
    }

    private SellerPromotionDto toPromotionDto(ShopPromotion pr) {
        return SellerPromotionDto.builder()
                .id(pr.getId())
                .name(pr.getName())
                .discountPercent(pr.getDiscountPercent())
                .productCount(pr.getProductCount())
                .timeRange(pr.getTimeRange())
                .status(pr.getStatus())
                .build();
    }

    private SellerReviewQuestionDto toReviewDto(ShopReview r) {
        String cName = r.getCustomerName();
        if ((cName == null || cName.isBlank()) && r.getCustomer() != null) {
            cName = r.getCustomer().getName() != null ? r.getCustomer().getName() : r.getCustomer().getEmail();
        }
        return SellerReviewQuestionDto.builder()
                .id(r.getId())
                .customerName(cName != null ? cName : "Khách hàng")
                .productName(r.getProductName() != null ? r.getProductName() : "Sản phẩm của shop")
                .productImage(r.getProductImage() != null ? r.getProductImage() : IMG_LAMP_CLOUD)
                .rating(r.getRating() != null ? r.getRating() : 5)
                .comment(r.getComment())
                .createdAt(r.getCreatedAtLabel() != null ? r.getCreatedAtLabel() : "Vừa xong")
                .reply(r.getReply())
                .build();
    }
}
