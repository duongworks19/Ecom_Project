package com.vic.ecom.services;

import com.vic.ecom.dto.VoucherDtos;
import com.vic.ecom.dto.seller.*;
import com.vic.ecom.entity.*;
import com.vic.ecom.enums.ApprovalStatus;
import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.enums.VoucherStatus;
import com.vic.ecom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final VoucherRepository voucherRepository;
    private final ShopPromotionRepository shopPromotionRepository;
    private final ShopReviewRepository shopReviewRepository;
    private final DispatchService dispatchService;
    private final OrderStockReleaseService stockRelease;
    private final OrderStatusHistoryRepository orderHistory;

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

        if (productRepository.findByShopIdOrderByIdDesc(shopId).isEmpty()) {
            List<Product> initialProducts = List.of(
                    buildProduct(shop, "Đèn ngủ gốm Cloud", "Màu kem", "LM-021", "Đèn trang trí", BigDecimal.valueOf(420000), 2, 84, "#f3c7c0", IMG_LAMP_CLOUD),
                    buildProduct(shop, "Khung tranh gỗ sồi A4", "Size A4", "LM-044", "Khung & Tranh", BigDecimal.valueOf(190000), 3, 142, "#d9d2c6", IMG_OAK_FRAME),
                    buildProduct(shop, "Bình hoa thủy tinh", "Xanh sage", "LM-007", "Lọ & Bình hoa", BigDecimal.valueOf(159000), 6, 215, "#c8d9c9", IMG_GLASS_VASE),
                    buildProduct(shop, "Nến thơm Lavender", "200g", "LM-063", "Nến & Tinh dầu", BigDecimal.valueOf(89000), 8, 310, "#c9d3e0", IMG_LAVENDER_CANDLE),
                    buildProduct(shop, "Gương để bàn lượn sóng Bắc Âu", "Trắng kem", "LM-088", "Gương decor", BigDecimal.valueOf(285000), 34, 96, "#e8dfd5", IMG_NORDIC_MIRROR),
                    buildProduct(shop, "Khay gốm sứ đựng trang sức Monstera", "Trắng ngà", "LM-052", "Phụ kiện bàn", BigDecimal.valueOf(135000), 42, 178, "#dce5df", IMG_CERAMIC_TRAY)
            );
            productRepository.saveAll(initialProducts);
        }

        // ponytail: Orders are created only by checkout; demo orders must never enter the production seller flow.
        if (false) {
            User defaultCustomer = userRepository.findAll().stream()
                    .findFirst()
                    .orElseGet(() -> shop.getVendor().getUser());

            List<Order> initialOrders = List.of(
                    buildOrder(shop, defaultCustomer, "#VM240918", "Nguyễn Thu Hà", "0912 345 678", "188 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội", "Đèn ngủ gốm Cloud ×1", IMG_LAMP_CLOUD, BigDecimal.valueOf(420000), OrderStatus.PENDING),
                    buildOrder(shop, defaultCustomer, "#VM240917", "Trần Minh Quân", "0988 765 432", "72 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội", "Nến thơm Lavender ×3", IMG_LAVENDER_CANDLE, BigDecimal.valueOf(267000), OrderStatus.PENDING),
                    buildOrder(shop, defaultCustomer, "#VM240915", "Lê Phương Anh", "0904 112 233", "Tòa S2 Vinhomes Skylake, Phạm Hùng, Nam Từ Liêm, Hà Nội", "Khung tranh gỗ sồi A4 ×2", IMG_OAK_FRAME, BigDecimal.valueOf(380000), OrderStatus.PREPARING),
                    buildOrder(shop, defaultCustomer, "#VM240912", "Phạm Đức Long", "0936 998 877", "25 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội", "Bình hoa thủy tinh ×1", IMG_GLASS_VASE, BigDecimal.valueOf(159000), OrderStatus.PACKED)
            );
            orderRepository.saveAll(initialOrders);
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

    private Product buildProduct(Shop shop, String name, String variant, String sku, String category, BigDecimal price, int stock, int soldCount, String color, String imageUrl) {
        Product p = new Product();
        p.setShop(shop);
        p.setName(name);
        p.setCategory(category);
        p.setImageUrl(imageUrl);
        p.setStatus(stock <= 10 ? "LOW_STOCK" : "VISIBLE");

        ProductVariant pv = new ProductVariant();
        pv.setVariantName(variant);
        pv.setSku(sku);
        pv.setPrice(price);
        pv.setStockQty(stock);
        pv.setSoldCount(soldCount);
        pv.setThumbnailColor(color);
        pv.setImageUrl(imageUrl);
        pv.setLowStockThreshold(5);

        p.addVariant(pv);
        return p;
    }

    private Order buildOrder(Shop shop, User customer, String code, String customerName, String phone, String address, String summary, String image, BigDecimal amount, OrderStatus status) {
        Order o = new Order();
        o.setShopId(shop.getId());
        o.setCustomer(customer);
        o.setOrderCode(code);
        o.setReceiverName(customerName);
        o.setReceiverPhone(phone);
        o.setShippingAddress(address);
        o.setProductSummary(summary);
        o.setProductImage(image);
        o.setTotalAmount(amount);
        o.setStatus(status);
        return o;
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
        if (userId == null) {
            throw new IllegalArgumentException("Không xác định được tài khoản người bán");
        }
        Vendor vendor = vendorRepository.findByUserId(userId)
                .filter(v -> v.getApprovalStatus() == ApprovalStatus.APPROVED)
                .orElseThrow(() -> new IllegalArgumentException("Tài khoản chưa có gian hàng được phê duyệt"));
        Shop shop = vendor.getShop();
        if (shop == null || shop.getStatus() != ShopStatus.ACTIVE) {
            throw new IllegalArgumentException("Không tìm thấy gian hàng đang hoạt động của tài khoản");
        }
        Long shopId = shop.getId();

        String shopName = (shop.getName() != null && !shop.getName().isBlank()) ? shop.getName() : "Lumi Home Decor";
        String avatarLetter = shopName.substring(0, 1).toUpperCase();
        String logo = shop.getLogo();
        boolean isApproved = shop.getStatus() == ShopStatus.ACTIVE;

        List<Product> dbProducts = productRepository.findByShopIdOrderByIdDesc(shopId);
        List<Order> dbOrders = orderRepository.findByShopIdOrderByCreatedAtDescIdDesc(shopId);
        List<Voucher> dbVouchers = voucherRepository.findByShopIdAndStatusNotOrderByIdDesc(shopId, VoucherStatus.DELETED);
        List<ShopPromotion> dbPromotions = shopPromotionRepository.findByShopIdOrderByIdDesc(shopId);
        List<ShopReview> dbReviews = shopReviewRepository.findByShopIdOrderByIdDesc(shopId);

        List<SellerProductDto> products = dbProducts.stream()
                .map(this::toProductDto)
                .collect(Collectors.toList());

        List<SellerLowStockDto> lowStock = new ArrayList<>();
        for (Product p : dbProducts) {
            if (p.getVariants() != null) {
                for (ProductVariant v : p.getVariants()) {
                    if (v.getStockQty() != null && v.getStockQty() <= 10) {
                        lowStock.add(toLowStockDto(p, v));
                    }
                }
            }
        }

        List<SellerRecentOrderDto> recentOrders = dbOrders.stream()
                .map(this::toOrderDto)
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        List<VoucherDtos.Response> vouchers = dbVouchers.stream()
                .map(v -> VoucherService.toResponse(v, now))
                .collect(Collectors.toList());

        List<SellerPromotionDto> promotions = dbPromotions.stream()
                .map(this::toPromotionDto)
                .collect(Collectors.toList());

        List<SellerReviewQuestionDto> allReviewQuestionDtos = dbReviews.stream()
                .map(this::toReviewDto)
                .collect(Collectors.toList());

        List<SellerReviewQuestionDto> reviews = allReviewQuestionDtos.stream()
                .filter(r -> !"QA".equalsIgnoreCase(r.getType()) && (r.getRating() == null || r.getRating() > 0))
                .collect(Collectors.toList());

        List<SellerReviewQuestionDto> questions = allReviewQuestionDtos.stream()
                .filter(r -> "QA".equalsIgnoreCase(r.getType()) || (r.getRating() != null && r.getRating() == 0))
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

        int pendingConfirmCount = (int) dbOrders.stream().filter(o -> o.getStatus() == OrderStatus.PENDING).count();
        int preparingCount = (int) dbOrders.stream().filter(o -> o.getStatus() == OrderStatus.PREPARING || o.getStatus() == OrderStatus.CONFIRMED).count();
        int refundCount = (int) dbOrders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();
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
                .questions(questions)
                .shopProfile(shopProfile)
                .build();
    }

    @Transactional
    public SellerRecentOrderDto handleQuickAction(String orderCode, OrderQuickActionRequest request) {
        Shop shop = getOrCreateInitializedShop(null);
        String action = request.getAction() != null ? request.getAction() : "";

        Optional<Order> orderOpt = orderRepository.findByOrderCode(orderCode);
        if (orderOpt.isEmpty() && !orderCode.startsWith("#")) {
            orderOpt = orderRepository.findByOrderCode("#" + orderCode);
        }

        Order order = orderOpt.orElseGet(() -> {
            Order newOrder = new Order();
            newOrder.setShopId(shop.getId());
            newOrder.setOrderCode(orderCode);
            newOrder.setReceiverName("Khách hàng");
            newOrder.setProductSummary("Sản phẩm");
            newOrder.setTotalAmount(BigDecimal.ZERO);
            return newOrder;
        });

        if ("CONFIRM".equalsIgnoreCase(action)) {
            OrderStatus previous = order.getStatus();
            order.setStatus(OrderStatus.PREPARING);
            saveOrderHistory(order, previous, OrderStatus.PREPARING, shop.getVendor().getUser().getId(), "Vendor xác nhận và bắt đầu chuẩn bị hàng");
        } else if ("MARK_PACKED".equalsIgnoreCase(action)) {
            OrderStatus previous = order.getStatus();
            order.setStatus(OrderStatus.PACKED);
            saveOrderHistory(order, previous, OrderStatus.PACKED, shop.getVendor().getUser().getId(), "Vendor đã đóng gói đơn hàng");
        } else if ("START_SHIPPING".equalsIgnoreCase(action)) {
            OrderStatus previous = order.getStatus();
            order.setStatus(OrderStatus.READY_TO_SHIP);
            saveOrderHistory(order, previous, OrderStatus.READY_TO_SHIP, shop.getVendor().getUser().getId(), "Vendor chuyển đơn sang chờ điều phối");
            if (TransactionSynchronizationManager.isSynchronizationActive()) {
                TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                    @Override
                    public void afterCommit() {
                        dispatchService.dispatchPendingOrders();
                    }
                });
            }
        } else if ("APPROVE_REFUND".equalsIgnoreCase(action) || "CANCEL".equalsIgnoreCase(action)) {
            if (order.getId() != null && order.getStatus() != OrderStatus.CANCELLED && order.getStatus() != OrderStatus.REJECTED) {
                order.setStatus(OrderStatus.CANCELLED);
                stockRelease.releaseOrderStock(order);
            }
        }

        Order saved = orderRepository.save(order);
        return toOrderDto(saved);
    }

    private void saveOrderHistory(Order order, OrderStatus from, OrderStatus to, Long userId, String note) {
        OrderStatusHistory history = new OrderStatusHistory();
        history.setOrderId(order.getId());
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(userId);
        history.setNote(note);
        orderHistory.save(history);
    }

    @Transactional
    public SellerLowStockDto updateProductStock(Long productId, SellerStockUpdateRequest request) {
        Shop shop = getOrCreateInitializedShop(null);
        Optional<Product> productOpt = productRepository.findById(productId);

        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            ProductVariant firstVariant = (product.getVariants() != null && !product.getVariants().isEmpty()) ? product.getVariants().get(0) : null;
            if (firstVariant != null) {
                int currentStock = firstVariant.getStockQty() != null ? firstVariant.getStockQty() : 0;
                int updatedQty;
                if (request.getNewQuantity() != null) {
                    updatedQty = request.getNewQuantity();
                } else if (request.getAddQuantity() != null) {
                    updatedQty = currentStock + request.getAddQuantity();
                } else {
                    updatedQty = currentStock + 20;
                }
                firstVariant.setStockQty(updatedQty);
                product.setStatus(updatedQty <= 10 ? "LOW_STOCK" : "VISIBLE");
                productRepository.save(product);
                return toLowStockDto(product, firstVariant);
            }
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

        Product product = new Product();
        product.setShop(shop);
        product.setName(request.getName() != null ? request.getName().trim() : "Sản phẩm mới");
        product.setCategory(request.getCategory() != null && !request.getCategory().isBlank() ? request.getCategory().trim() : "Đèn trang trí");
        product.setImageUrl(request.getImageUrl() != null && !request.getImageUrl().isBlank()
                ? request.getImageUrl()
                : IMG_LAMP_CLOUD);
        int stock = request.getStock() != null ? request.getStock() : 20;
        product.setStatus(stock <= 10 ? "LOW_STOCK" : "VISIBLE");

        ProductVariant pv = new ProductVariant();
        pv.setVariantName(request.getVariant() != null && !request.getVariant().isBlank() ? request.getVariant().trim() : "Tiêu chuẩn");
        pv.setSku(request.getSku() != null && !request.getSku().isBlank()
                ? request.getSku().trim().toUpperCase()
                : "LM-" + (100 + new Random().nextInt(900)));
        pv.setPrice(request.getPrice() != null ? request.getPrice() : BigDecimal.valueOf(150000));
        pv.setStockQty(stock);
        pv.setSoldCount(request.getSoldCount() != null ? request.getSoldCount() : 0);
        pv.setThumbnailColor(request.getThumbnailColor() != null && !request.getThumbnailColor().isBlank()
                ? request.getThumbnailColor()
                : "#f3c7c0");
        pv.setImageUrl(product.getImageUrl());
        product.addVariant(pv);

        Product saved = productRepository.save(product);
        return toProductDto(saved);
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

    public Shop resolveShop(Long userId) {
        if (userId != null) {
            Optional<Vendor> vendorOpt = vendorRepository.findByUserId(userId);
            if (vendorOpt.isPresent() && vendorOpt.get().getShop() != null) {
                return vendorOpt.get().getShop();
            }
        }
        return getOrCreateInitializedShop(userId);
    }

    @Transactional(readOnly = true)
    public List<SellerRecentOrderDto> getOrders(Long userId) {
        Shop shop = resolveShop(userId);
        if (shop == null) return Collections.emptyList();
        List<Order> dbOrders = orderRepository.findByShopIdOrderByCreatedAtDescIdDesc(shop.getId());
        return dbOrders.stream().map(this::toOrderDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SellerLowStockDto> getInventory(Long userId) {
        Shop shop = resolveShop(userId);
        if (shop == null) return Collections.emptyList();
        List<Product> dbProducts = productRepository.findByShopIdOrderByIdDesc(shop.getId());
        List<SellerLowStockDto> list = new ArrayList<>();
        for (Product p : dbProducts) {
            if (p.getVariants() != null) {
                for (ProductVariant v : p.getVariants()) {
                    list.add(toLowStockDto(p, v));
                }
            }
        }
        return list;
    }

    @Transactional(readOnly = true)
    public List<SellerReviewQuestionDto> getReviews(Long userId) {
        Shop shop = resolveShop(userId);
        if (shop == null) return Collections.emptyList();
        List<ShopReview> dbReviews = shopReviewRepository.findByShopIdOrderByIdDesc(shop.getId());
        return dbReviews.stream()
                .filter(r -> !"QA".equalsIgnoreCase(r.getType()) && (r.getRating() == null || r.getRating() > 0))
                .map(this::toReviewDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SellerReviewQuestionDto> getQuestions(Long userId) {
        Shop shop = resolveShop(userId);
        if (shop == null) return Collections.emptyList();
        List<ShopReview> dbReviews = shopReviewRepository.findByShopIdOrderByIdDesc(shop.getId());
        return dbReviews.stream()
                .filter(r -> "QA".equalsIgnoreCase(r.getType()) || (r.getRating() != null && r.getRating() == 0))
                .map(this::toReviewDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public SellerShopProfileDto getShopProfile(Long userId) {
        Shop shop = resolveShop(userId);
        if (shop == null) return new SellerShopProfileDto();
        String shopName = (shop.getName() != null && !shop.getName().isBlank()) ? shop.getName() : "Lumi Home Decor";
        return SellerShopProfileDto.builder()
                .shopName(shopName)
                .tagline(shop.getTagline() != null ? shop.getTagline() : "Minimalist & Cozy Scandinavian Living")
                .description(shop.getDescription() != null ? shop.getDescription() : "")
                .phone(shop.getPhone() != null ? shop.getPhone() : "0987 654 321")
                .email(shop.getEmail() != null ? shop.getEmail() : "hello@lumihomedecor.vn")
                .pickupAddress(shop.getPickupAddress() != null ? shop.getPickupAddress() : "")
                .businessHours(shop.getBusinessHours() != null ? shop.getBusinessHours() : "08:30 - 21:00 (Thứ 2 - Chủ Nhật)")
                .build();
    }

    private SellerProductDto toProductDto(Product p) {
        ProductVariant firstVariant = (p.getVariants() != null && !p.getVariants().isEmpty()) ? p.getVariants().get(0) : null;
        BigDecimal price = firstVariant != null ? firstVariant.getPrice() : BigDecimal.ZERO;
        int stock = p.getVariants() != null ? p.getVariants().stream().mapToInt(v -> v.getStockQty() != null ? v.getStockQty() : 0).sum() : 0;
        int soldCount = p.getVariants() != null ? p.getVariants().stream().mapToInt(v -> v.getSoldCount() != null ? v.getSoldCount() : 0).sum() : 0;
        String sku = firstVariant != null ? firstVariant.getSku() : "";
        String variantName = firstVariant != null ? firstVariant.getVariantName() : "Mặc định";
        String color = firstVariant != null ? firstVariant.getThumbnailColor() : null;

        return SellerProductDto.builder()
                .id(p.getId())
                .name(p.getName())
                .variant(variantName)
                .sku(sku)
                .category(p.getCategory())
                .price(price)
                .stock(stock)
                .soldCount(soldCount)
                .thumbnailColor(color)
                .imageUrl(p.getImageUrl())
                .status(p.getStatus())
                .build();
    }

    private SellerLowStockDto toLowStockDto(Product p, ProductVariant v) {
        int stock = v.getStockQty() != null ? v.getStockQty() : 0;
        return SellerLowStockDto.builder()
                .id(p.getId())
                .name(p.getName())
                .variant(v.getVariantName())
                .sku(v.getSku())
                .remainingQuantity(stock)
                .thumbnailColor(v.getThumbnailColor())
                .imageUrl(v.getImageUrl() != null ? v.getImageUrl() : p.getImageUrl())
                .badgeType(stock < 5 ? "danger" : "warning")
                .build();
    }

    private SellerRecentOrderDto toOrderDto(Order o) {
        String statusStr = o.getStatus() != null ? o.getStatus().name() : "PENDING";
        String statusLabel;
        String badgeClass;
        String actionText;
        String actionStyle;
        String nextAction;

        switch (statusStr) {
            case "PENDING":
                statusLabel = "Chờ xác nhận";
                badgeClass = "w";
                actionText = "Xác nhận";
                actionStyle = "red";
                nextAction = "CONFIRM";
                break;
            case "CONFIRMED":
                statusLabel = "Đã xác nhận";
                badgeClass = "o";
                actionText = "Chuẩn bị hàng";
                actionStyle = "outline";
                nextAction = "PREPARE";
                break;
            case "PREPARING":
                statusLabel = "Đang chuẩn bị";
                badgeClass = "o";
                actionText = "Đã đóng gói";
                actionStyle = "outline";
                nextAction = "MARK_PACKED";
                break;
            case "PACKED":
                statusLabel = "Đã đóng gói";
                badgeClass = "g";
                actionText = "Giao vận chuyển";
                actionStyle = "outline";
                nextAction = "START_SHIPPING";
                break;
            case "SHIPPING":
                statusLabel = "Đang giao hàng";
                badgeClass = "g";
                actionText = "Chi tiết";
                actionStyle = "outline";
                nextAction = "VIEW_DETAIL";
                break;
            case "DELIVERED":
                statusLabel = "Giao thành công";
                badgeClass = "g";
                actionText = "Chi tiết";
                actionStyle = "outline";
                nextAction = "VIEW_DETAIL";
                break;
            case "CANCELLED":
                statusLabel = "Đã hủy";
                badgeClass = "r";
                actionText = "Chi tiết";
                actionStyle = "outline";
                nextAction = "VIEW_DETAIL";
                break;
            default:
                statusLabel = statusStr;
                badgeClass = "o";
                actionText = "Chi tiết";
                actionStyle = "outline";
                nextAction = "VIEW_DETAIL";
        }

        String createdAtFormatted = o.getCreatedAt() != null
                ? o.getCreatedAt().format(java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm"))
                : "";

        String customerName = o.getReceiverName() != null && !o.getReceiverName().isBlank()
                ? o.getReceiverName()
                : (o.getCustomer() != null ? o.getCustomer().getFullName() : "Khách hàng");

        String customerPhone = o.getReceiverPhone() != null && !o.getReceiverPhone().isBlank()
                ? o.getReceiverPhone()
                : (o.getCustomer() != null ? o.getCustomer().getPhone() : "");

        String summary = o.getProductSummary() != null && !o.getProductSummary().isBlank()
                ? o.getProductSummary()
                : (o.getItems() != null && !o.getItems().isEmpty() ? o.getItems().get(0).getProductName() + " ×" + o.getItems().get(0).getQuantity() : "Đơn hàng");

        String image = o.getProductImage() != null && !o.getProductImage().isBlank()
                ? o.getProductImage()
                : IMG_LAMP_CLOUD;

        return SellerRecentOrderDto.builder()
                .id(o.getId())
                .orderCode(o.getOrderCode())
                .customerName(customerName)
                .customerPhone(customerPhone)
                .shippingAddress(o.getShippingAddress() != null ? o.getShippingAddress() : "")
                .createdAt(createdAtFormatted)
                .productSummary(summary)
                .productImage(image)
                .totalAmount(o.getTotalAmount())
                .status(statusStr)
                .statusLabel(statusLabel)
                .badgeClass(badgeClass)
                .actionText(actionText)
                .actionStyle(actionStyle)
                .nextAction(nextAction)
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
                .productId(r.getProductId())
                .type(r.getType() != null ? r.getType() : "REVIEW")
                .reviewImage(r.getReviewImage())
                .helpfulCount(r.getHelpfulCount() != null ? r.getHelpfulCount() : 0)
                .verifiedPurchase(r.getVerifiedPurchase() != null ? r.getVerifiedPurchase() : true)
                .reply(r.getReply())
                .build();
    }
}
