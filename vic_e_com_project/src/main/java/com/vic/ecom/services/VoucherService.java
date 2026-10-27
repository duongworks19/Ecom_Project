package com.vic.ecom.services;

import com.vic.ecom.dto.VoucherDtos;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.User;
import com.vic.ecom.entity.Vendor;
import com.vic.ecom.entity.Voucher;
import com.vic.ecom.enums.VoucherDiscountType;
import com.vic.ecom.enums.VoucherStatus;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.repository.VendorRepository;
import com.vic.ecom.repository.VoucherRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserRepository userRepository;
    private final VendorRepository vendorRepository;
    private final ShopRepository shopRepository;

    @Transactional(readOnly = true)
    public Shop resolveCurrentShop() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            throw CustomerAccountException.unauthorized("Chưa đăng nhập");
        }
        String principal = auth.getName();
        User user = userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .orElseThrow(() -> CustomerAccountException.unauthorized("Không tìm thấy thông tin tài khoản"));

        Vendor vendor = vendorRepository.findByUserId(user.getId())
                .orElseThrow(() -> CustomerAccountException.forbidden("Tài khoản chưa đăng ký người bán"));

        Shop shop = vendor.getShop();
        if (shop == null) {
            shop = shopRepository.findByVendorId(vendor.getId())
                    .orElseThrow(() -> CustomerAccountException.notFound("SHOP_NOT_FOUND", "Không tìm thấy gian hàng"));
        }
        return shop;
    }

    public static String computeDisplayStatus(Voucher v, LocalDateTime now) {
        if (v.getStatus() == VoucherStatus.PAUSED) {
            return "PAUSED";
        }
        if (now.isBefore(v.getStartAt())) {
            return "UPCOMING";
        }
        if (now.isAfter(v.getEndAt())) {
            return "EXPIRED";
        }
        if (v.getUsedCount() != null && v.getUsageLimit() != null && v.getUsedCount() >= v.getUsageLimit()) {
            return "EXHAUSTED";
        }
        return "RUNNING";
    }

    public static VoucherDtos.Response toResponse(Voucher v, LocalDateTime now) {
        return VoucherDtos.Response.from(v, computeDisplayStatus(v, now));
    }

    @Transactional(readOnly = true)
    public List<VoucherDtos.Response> getVouchers(String statusFilter) {
        Shop shop = resolveCurrentShop();
        return getVouchersByShop(shop, statusFilter);
    }

    @Transactional(readOnly = true)
    public List<VoucherDtos.Response> getVouchersByShop(Shop shop, String statusFilter) {
        // ponytail: Hiện tại danh sách voucher chưa hỗ trợ phân trang do số lượng voucher trung bình của mỗi shop chưa lớn (< 100).
        // Hướng nâng cấp: Chuyển sang Spring Data Pageable với PagedModel/Slice khi số lượng voucher của từng shop tăng lên.
        List<Voucher> vouchers = voucherRepository.findByShopIdAndStatusNotOrderByIdDesc(shop.getId(), VoucherStatus.DELETED);
        LocalDateTime now = LocalDateTime.now();

        return vouchers.stream()
                .map(v -> toResponse(v, now))
                .filter(res -> {
                    if (statusFilter == null || statusFilter.isBlank()) {
                        return true;
                    }
                    return res.displayStatus().equalsIgnoreCase(statusFilter.trim());
                })
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public VoucherDtos.Response getVoucherById(Long id) {
        Shop shop = resolveCurrentShop();
        Voucher voucher = voucherRepository.findByIdAndShopIdAndStatusNot(id, shop.getId(), VoucherStatus.DELETED)
                .orElseThrow(() -> CustomerAccountException.notFound("VOUCHER_NOT_FOUND", "Không tìm thấy voucher"));
        return toResponse(voucher, LocalDateTime.now());
    }

    @Transactional
    public VoucherDtos.Response createVoucher(VoucherDtos.CreateRequest req) {
        Shop shop = resolveCurrentShop();
        LocalDateTime now = LocalDateTime.now();

        String normalizedCode = normalizeAndValidateCode(req.code());

        if (voucherRepository.existsByShopIdAndCodeIgnoreCaseAndStatusNot(shop.getId(), normalizedCode, VoucherStatus.DELETED)) {
            throw CustomerAccountException.conflict("DUPLICATE_CODE", "Mã voucher đã tồn tại trong gian hàng", "code");
        }

        LocalDateTime startAt = req.startAt() != null ? req.startAt() : now;
        BigDecimal minOrderAmount = req.minOrderAmount() != null ? req.minOrderAmount() : BigDecimal.ZERO;

        validateVoucherFields(req.discountType(), req.value(), req.maxDiscount(), minOrderAmount, req.usageLimit(), startAt, req.endAt(), now);

        BigDecimal maxDiscount = req.discountType() == VoucherDiscountType.PERCENT ? req.maxDiscount() : null;

        Voucher voucher = Voucher.builder()
                .shop(shop)
                .code(normalizedCode)
                .discountType(req.discountType())
                .value(req.value())
                .maxDiscount(maxDiscount)
                .minOrderAmount(minOrderAmount)
                .usageLimit(req.usageLimit())
                .usedCount(0)
                .startAt(startAt)
                .endAt(req.endAt())
                .status(VoucherStatus.ACTIVE)
                .createdAt(now)
                .build();

        Voucher saved = voucherRepository.save(voucher);
        return toResponse(saved, now);
    }

    @Transactional
    public VoucherDtos.Response updateVoucher(Long id, VoucherDtos.UpdateRequest req) {
        Shop shop = resolveCurrentShop();
        LocalDateTime now = LocalDateTime.now();

        Voucher voucher = voucherRepository.findByIdAndShopIdAndStatusNot(id, shop.getId(), VoucherStatus.DELETED)
                .orElseThrow(() -> CustomerAccountException.notFound("VOUCHER_NOT_FOUND", "Không tìm thấy voucher"));

        String normalizedCode = normalizeAndValidateCode(req.code());

        BigDecimal reqMinOrder = req.minOrderAmount() != null ? req.minOrderAmount() : BigDecimal.ZERO;

        if (voucher.getUsedCount() != null && voucher.getUsedCount() > 0) {
            // Locked fields: code, discountType, value, maxDiscount, minOrderAmount, startAt
            if (!voucher.getCode().equalsIgnoreCase(normalizedCode)) {
                throw CustomerAccountException.conflict("LOCKED_FIELD", "Không thể sửa mã voucher đã có lượt sử dụng", "code");
            }
            if (voucher.getDiscountType() != req.discountType()) {
                throw CustomerAccountException.conflict("LOCKED_FIELD", "Không thể sửa loại giảm giá khi voucher đã có lượt sử dụng", "discountType");
            }
            if (voucher.getValue().compareTo(req.value()) != 0) {
                throw CustomerAccountException.conflict("LOCKED_FIELD", "Không thể sửa giá trị giảm giá khi voucher đã có lượt sử dụng", "value");
            }
            boolean maxDiscountChanged = false;
            if (voucher.getMaxDiscount() == null && req.maxDiscount() != null) {
                maxDiscountChanged = true;
            } else if (voucher.getMaxDiscount() != null && req.maxDiscount() == null) {
                maxDiscountChanged = true;
            } else if (voucher.getMaxDiscount() != null && req.maxDiscount() != null
                    && voucher.getMaxDiscount().compareTo(req.maxDiscount()) != 0) {
                maxDiscountChanged = true;
            }
            if (maxDiscountChanged) {
                throw CustomerAccountException.conflict("LOCKED_FIELD", "Không thể sửa mức giảm tối đa khi voucher đã có lượt sử dụng", "maxDiscount");
            }
            if (voucher.getMinOrderAmount().compareTo(reqMinOrder) != 0) {
                throw CustomerAccountException.conflict("LOCKED_FIELD", "Không thể sửa giá trị đơn hàng tối thiểu khi voucher đã có lượt sử dụng", "minOrderAmount");
            }
            if (req.startAt() != null && !req.startAt().isEqual(voucher.getStartAt())) {
                throw CustomerAccountException.conflict("LOCKED_FIELD", "Không thể sửa thời gian bắt đầu khi voucher đã có lượt sử dụng", "startAt");
            }

            // Can only increase usageLimit
            if (req.usageLimit() < voucher.getUsageLimit()) {
                throw CustomerAccountException.conflict("INVALID_USAGE_LIMIT", "Chỉ được phép tăng lượt sử dụng cho voucher đã có lượt dùng", "usageLimit");
            }

            // Can only extend endAt
            if (req.endAt().isBefore(voucher.getEndAt())) {
                throw CustomerAccountException.conflict("INVALID_END_DATE", "Chỉ được phép kéo dài thời gian kết thúc", "endAt");
            }
            if (!req.endAt().isAfter(now)) {
                throw CustomerAccountException.unprocessable("INVALID_END_DATE", "Thời gian kết thúc phải sau thời điểm hiện tại", "endAt");
            }

            voucher.setUsageLimit(req.usageLimit());
            voucher.setEndAt(req.endAt());
        } else {
            // Free edit when usedCount == 0
            if (voucherRepository.existsByShopIdAndCodeIgnoreCaseAndStatusNotAndIdNot(shop.getId(), normalizedCode, VoucherStatus.DELETED, id)) {
                throw CustomerAccountException.conflict("DUPLICATE_CODE", "Mã voucher đã tồn tại trong gian hàng", "code");
            }

            LocalDateTime startAt = req.startAt() != null ? req.startAt() : (voucher.getStartAt() != null ? voucher.getStartAt() : now);
            validateVoucherFields(req.discountType(), req.value(), req.maxDiscount(), reqMinOrder, req.usageLimit(), startAt, req.endAt(), now);

            BigDecimal maxDiscount = req.discountType() == VoucherDiscountType.PERCENT ? req.maxDiscount() : null;

            voucher.setCode(normalizedCode);
            voucher.setDiscountType(req.discountType());
            voucher.setValue(req.value());
            voucher.setMaxDiscount(maxDiscount);
            voucher.setMinOrderAmount(reqMinOrder);
            voucher.setUsageLimit(req.usageLimit());
            voucher.setStartAt(startAt);
            voucher.setEndAt(req.endAt());
        }

        Voucher saved = voucherRepository.save(voucher);
        return toResponse(saved, now);
    }

    @Transactional
    public VoucherDtos.Response updateStatus(Long id, VoucherDtos.StatusRequest req) {
        Shop shop = resolveCurrentShop();
        LocalDateTime now = LocalDateTime.now();

        Voucher voucher = voucherRepository.findByIdAndShopIdAndStatusNot(id, shop.getId(), VoucherStatus.DELETED)
                .orElseThrow(() -> CustomerAccountException.notFound("VOUCHER_NOT_FOUND", "Không tìm thấy voucher"));

        if (req.status() != VoucherStatus.ACTIVE && req.status() != VoucherStatus.PAUSED) {
            throw CustomerAccountException.unprocessable("INVALID_STATUS", "Chỉ được chuyển trạng thái giữa ACTIVE và PAUSED", "status");
        }

        if (now.isAfter(voucher.getEndAt())) {
            throw CustomerAccountException.conflict("VOUCHER_EXPIRED", "Không thể thay đổi trạng thái của voucher đã hết hạn", "status");
        }

        voucher.setStatus(req.status());
        Voucher saved = voucherRepository.save(voucher);
        return toResponse(saved, now);
    }

    @Transactional
    public void deleteVoucher(Long id) {
        Shop shop = resolveCurrentShop();
        Voucher voucher = voucherRepository.findByIdAndShopIdAndStatusNot(id, shop.getId(), VoucherStatus.DELETED)
                .orElseThrow(() -> CustomerAccountException.notFound("VOUCHER_NOT_FOUND", "Không tìm thấy voucher"));

        voucher.setStatus(VoucherStatus.DELETED);
        voucherRepository.save(voucher);
    }

    private String normalizeAndValidateCode(String rawCode) {
        if (rawCode == null || rawCode.isBlank()) {
            throw CustomerAccountException.unprocessable("INVALID_CODE", "Mã voucher không được để trống", "code");
        }
        String normalized = rawCode.trim().toUpperCase();
        if (!normalized.matches("^[A-Z0-9]{3,20}$")) {
            throw CustomerAccountException.unprocessable("INVALID_CODE", "Mã voucher chỉ gồm chữ và số từ 3 đến 20 ký tự", "code");
        }
        return normalized;
    }

    private void validateVoucherFields(
            VoucherDiscountType discountType,
            BigDecimal value,
            BigDecimal maxDiscount,
            BigDecimal minOrderAmount,
            Integer usageLimit,
            LocalDateTime startAt,
            LocalDateTime endAt,
            LocalDateTime now
    ) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) {
            throw CustomerAccountException.unprocessable("INVALID_VALUE", "Giá trị giảm giá phải lớn hơn 0", "value");
        }
        if (discountType == VoucherDiscountType.PERCENT) {
            if (value.compareTo(BigDecimal.valueOf(100)) > 0) {
                throw CustomerAccountException.unprocessable("INVALID_VALUE", "Phần trăm giảm giá không được vượt quá 100%", "value");
            }
            if (maxDiscount != null && maxDiscount.compareTo(BigDecimal.ZERO) <= 0) {
                throw CustomerAccountException.unprocessable("INVALID_MAX_DISCOUNT", "Mức giảm tối đa phải lớn hơn 0", "maxDiscount");
            }
        } else if (discountType == VoucherDiscountType.FIXED) {
            if (maxDiscount != null) {
                throw CustomerAccountException.unprocessable("INVALID_MAX_DISCOUNT", "Mức giảm tối đa chỉ áp dụng cho giảm giá theo phần trăm", "maxDiscount");
            }
        }

        if (minOrderAmount != null && minOrderAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw CustomerAccountException.unprocessable("INVALID_MIN_ORDER_AMOUNT", "Đơn hàng tối thiểu phải lớn hơn hoặc bằng 0", "minOrderAmount");
        }

        if (usageLimit == null || usageLimit < 1) {
            throw CustomerAccountException.unprocessable("INVALID_USAGE_LIMIT", "Lượt sử dụng tối đa phải từ 1 trở lên", "usageLimit");
        }

        if (endAt == null) {
            throw CustomerAccountException.unprocessable("INVALID_END_DATE", "Thời gian kết thúc không được để trống", "endAt");
        }

        if (startAt != null && !endAt.isAfter(startAt)) {
            throw CustomerAccountException.unprocessable("INVALID_DATE_RANGE", "Thời gian kết thúc phải sau thời gian bắt đầu", "endAt");
        }

        if (!endAt.isAfter(now)) {
            throw CustomerAccountException.unprocessable("INVALID_END_DATE", "Thời gian kết thúc phải sau thời điểm hiện tại", "endAt");
        }
    }
}
