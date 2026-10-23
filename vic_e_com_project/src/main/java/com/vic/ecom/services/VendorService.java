package com.vic.ecom.services;

import com.vic.ecom.dto.vendor.VendorRegisterRequest;
import com.vic.ecom.dto.vendor.VendorResponse;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.User;
import com.vic.ecom.entity.Vendor;
import com.vic.ecom.entity.VendorViolation;
import com.vic.ecom.enums.ApprovalStatus;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.repository.VendorRepository;
import com.vic.ecom.repository.VendorViolationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final VendorViolationRepository vendorViolationRepository;

    public boolean isShopNameAvailable(String name) {
        if (name == null || name.trim().length() < 3) return false;
        return !shopRepository.existsByNameIgnoreCase(name.trim());
    }

    @Transactional(readOnly = true)
    public VendorResponse getMyVendorProfile(Long userId) {
        return vendorRepository.findByUserId(userId)
                .map(VendorResponse::fromEntity)
                .orElse(null);
    }

    @Transactional
    public VendorResponse registerVendor(Long userId, VendorRegisterRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));

        if (vendorRepository.existsByUserId(userId)) {
            throw new IllegalArgumentException("Tài khoản này đã có hồ sơ đăng ký người bán");
        }

        if (shopRepository.existsByNameIgnoreCase(req.getShopName().trim())) {
            throw new IllegalArgumentException("Tên gian hàng đã tồn tại trên hệ thống");
        }

        // 1. Tạo Vendor
        Vendor vendor = new Vendor();
        vendor.setUser(user);
        vendor.setBusinessName(req.getBusinessName());
        vendor.setKycDocumentUrl(req.getKycDocumentUrl());
        vendor.setApprovalStatus(ApprovalStatus.PENDING);

        // 2. Tạo Shop liên kết 1-1
        Shop shop = new Shop();
        shop.setVendor(vendor);
        shop.setName(req.getShopName().trim());
        shop.setLogo(req.getLogo());
        shop.setBanner(req.getBanner());
        shop.setDescription(req.getDescription());
        shop.setPickupAddress(req.getPickupAddress());
        shop.setStatus(ShopStatus.INACTIVE); // Chờ duyệt
        shop.setRatingAvg(BigDecimal.ZERO);

        vendor.setShop(shop);

        Vendor saved = vendorRepository.save(vendor);
        return VendorResponse.fromEntity(saved);
    }

    @Transactional
    public VendorResponse reviewVendor(Long adminId, Long vendorId, String action, String rejectReason) {
        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ người bán"));

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin quản trị viên"));

        vendor.setApprovedBy(admin);

        if ("APPROVE".equalsIgnoreCase(action)) {
            vendor.setApprovalStatus(ApprovalStatus.APPROVED);
            vendor.setRejectReason(null);

            // Nâng cấp vai trò user thành VENDOR
            User user = vendor.getUser();
            if (user != null) {
                user.setRole(UserRole.VENDOR);
                userRepository.save(user);
            }

            // Kích hoạt gian hàng
            if (vendor.getShop() != null) {
                vendor.getShop().setStatus(ShopStatus.ACTIVE);
            }
        } else if ("REJECT".equalsIgnoreCase(action)) {
            vendor.setApprovalStatus(ApprovalStatus.REJECTED);
            vendor.setRejectReason(rejectReason);

            if (vendor.getShop() != null) {
                vendor.getShop().setStatus(ShopStatus.INACTIVE);
            }
        } else {
            throw new IllegalArgumentException("Thao tác duyệt không hợp lệ: " + action);
        }

        return VendorResponse.fromEntity(vendorRepository.save(vendor));
    }

    @Transactional
    public VendorResponse reviewVendorByAdmin(String adminPrincipal, Long vendorId, String action, String rejectReason) {
        if (adminPrincipal == null || adminPrincipal.isBlank()) {
            throw new IllegalArgumentException("Không xác định được quản trị viên");
        }
        User admin = userRepository.findByEmail(adminPrincipal)
                .or(() -> userRepository.findByPhone(adminPrincipal))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin quản trị viên"));
        return reviewVendor(admin.getId(), vendorId, action, rejectReason);
    }

    @Transactional
    public void terminateVendorAccount(String adminPrincipal, Long vendorId, String violationType, String reason) {
        if (adminPrincipal == null || adminPrincipal.isBlank()) {
            throw new IllegalArgumentException("Không xác định được thông tin quản trị viên");
        }
        User admin = userRepository.findByEmail(adminPrincipal)
                .or(() -> userRepository.findByPhone(adminPrincipal))
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin quản trị viên"));

        Vendor vendor = vendorRepository.findById(vendorId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ người bán (id=" + vendorId + ")"));

        // 1. Chuyển trạng thái phê duyệt của Vendor sang REJECTED
        vendor.setApprovalStatus(ApprovalStatus.REJECTED);
        vendor.setRejectReason(reason);
        vendor.setApprovedBy(admin);

        // 2. Vô hiệu hóa Shop của người bán
        if (vendor.getShop() != null) {
            vendor.getShop().setStatus(ShopStatus.INACTIVE);
            shopRepository.save(vendor.getShop());
        }

        // 3. Khóa tài khoản User của người bán và hạ role về CUSTOMER, tăng tokenVersion để vô hiệu hóa JWT đang lưu
        User user = vendor.getUser();
        if (user != null) {
            user.setStatus(UserStatus.LOCKED);
            user.setRole(UserRole.CUSTOMER);
            user.setTokenVersion(user.getTokenVersion() + 1);
            userRepository.save(user);
        }

        vendorRepository.save(vendor);

        // 4. Ghi vết vi phạm vào vendor_violations
        if (vendorViolationRepository != null) {
            VendorViolation violation = new VendorViolation();
            violation.setVendor(vendor);
            violation.setType(violationType != null && !violationType.isBlank() ? violationType : "TERMINATED");
            violation.setContent(reason);
            violation.setActionTaken("TERMINATE_ACCOUNT");
            violation.setCreatedBy(admin);
            vendorViolationRepository.save(violation);
        }
    }

    @Transactional(readOnly = true)
    public List<VendorResponse> getVendorsByStatus(ApprovalStatus status) {
        return vendorRepository.findByApprovalStatus(status).stream()
                .map(VendorResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
