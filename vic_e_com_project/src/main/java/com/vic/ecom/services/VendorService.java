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
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final ShopRepository shopRepository;
    private final UserRepository userRepository;
    private final VendorViolationRepository vendorViolationRepository;

    public record ShopNameValidationResult(boolean isAvailable, String message) {}

    private static final java.util.Set<String> RESERVED_BRANDS = new java.util.HashSet<>(java.util.Arrays.asList(
            "vicmart", "vic mart", "vic_mart", "vic-mart", "admin", "administrator", "banquantri", "official",
            "shopee", "lazada", "tiki", "sendo", "tiktokshop", "tongdai", "cskh", "hotro"
    ));

    private static final java.util.Set<String> PHRASE_BLACKLIST = new java.util.HashSet<>(java.util.Arrays.asList(
            "tai xiu", "taixiu", "tài xỉu", "co bac", "cờ bạc", "danh bac", "đánh bạc", "lo de", "lô đề", "casino",
            "lua dao", "lừa đảo", "scam", "scammer", "ma tuy", "ma túy", "can sa", "cần sa", "thuoc phien", "thuốc phiện",
            "gai goi", "gái gọi", "khoa than", "khỏa thân", "khieu dam", "khiêu dâm", "dam dang", "dâm đãng",
            "kich duc", "kích dục", "do choi nguoi lon", "đồ chơi người lớn", "sex toy", "sextoy", "massage 18", "18+",
            "suc vat", "súc vật", "vu khi", "vũ khí", "sung dan", "súng đạn", "chat no", "chất nổ", "thuoc no", "thuốc nổ",
            "du ma", "đụ má", "du me", "đụ mẹ", "dit me", "địt mẹ", "vai lon", "vãi lồn", "di cho", "đĩ chó", "con di", "con đĩ",
            "ban dam", "bán dâm", "lam tinh", "làm tình", "thu dam", "thủ dâm", "gai bao", "gái bao"
    ));

    // Từ ngữ thô tục / nhạy cảm yêu cầu dấu chính xác hoặc từ tiếng Anh rõ ràng để tránh false positive tiếng Việt
    private static final java.util.Set<String> ACCENTED_OR_EXACT_VULGAR = new java.util.HashSet<>(java.util.Arrays.asList(
            "địt", "đụ", "đù", "lồn", "cặc", "buồi", "dâm", "đĩ",
            "fuck", "fck", "fuk", "bitch", "dick", "pussy", "asshole", "cunt", "bastard", "nigger",
            "porn", "xxx", "sex", "nude", "nudes"
    ));

    public ShopNameValidationResult validateShopName(String name) {
        return validateShopName(name, null);
    }

    public ShopNameValidationResult validateShopName(String name, Long currentVendorId) {
        if (name == null || name.trim().isEmpty()) {
            return new ShopNameValidationResult(false, "Vui lòng nhập tên gian hàng.");
        }
        String trimmed = name.trim();
        if (trimmed.length() < 3) {
            return new ShopNameValidationResult(false, "Tên gian hàng phải từ 3 ký tự trở lên.");
        }
        if (trimmed.length() > 50) {
            return new ShopNameValidationResult(false, "Tên gian hàng không được vượt quá 50 ký tự.");
        }

        // 1. Kiểm tra từ nhạy cảm / vi phạm chuẩn mực đạo đức / thương hiệu hệ thống
        if (isSensitiveOrForbiddenShopName(trimmed)) {
            return new ShopNameValidationResult(false,
                    "Tên gian hàng chứa từ ngữ nhạy cảm, không đúng chuẩn mực hoặc vi phạm chính sách của sàn.");
        }

        // 2. Kiểm tra trùng tên với shop đã có trên hệ thống
        boolean exists = (currentVendorId != null)
                ? shopRepository.existsByNameIgnoreCaseAndVendorIdNot(trimmed, currentVendorId)
                : shopRepository.existsByNameIgnoreCase(trimmed);
        if (exists) {
            return new ShopNameValidationResult(false,
                    "Tên gian hàng \"" + trimmed + "\" đã được đăng ký bởi shop khác. Vui lòng chọn tên khác.");
        }

        return new ShopNameValidationResult(true, "Tên gian hàng hợp lệ và khả dụng.");
    }

    public boolean isShopNameAvailable(String name) {
        return validateShopName(name, null).isAvailable();
    }

    private boolean isSensitiveOrForbiddenShopName(String name) {
        if (name == null) return false;
        String lower = name.toLowerCase(java.util.Locale.ROOT);
        String unaccented = removeDiacritics(lower);
        String compact = unaccented.replaceAll("[^a-z0-9]", "");

        // 1. Kiểm tra reserved brands & system keywords
        for (String brand : RESERVED_BRANDS) {
            String brandCompact = removeDiacritics(brand).replaceAll("[^a-z0-9]", "");
            if (compact.contains(brandCompact)) {
                return true;
            }
        }

        // 2. Kiểm tra cụm từ nhạy cảm
        for (String phrase : PHRASE_BLACKLIST) {
            String pUnacc = removeDiacritics(phrase.toLowerCase(java.util.Locale.ROOT));
            if (lower.contains(phrase) || unaccented.contains(pUnacc)) {
                return true;
            }
            String pCompact = pUnacc.replaceAll("[^a-z0-9]", "");
            if (pCompact.length() >= 4 && compact.contains(pCompact)) {
                return true;
            }
        }

        // 3. Kiểm tra token thô tục độc lập
        String[] tokens = lower.split("[\\s\\p{Punct}]+");
        for (String tok : tokens) {
            if (ACCENTED_OR_EXACT_VULGAR.contains(tok)) {
                return true;
            }
        }

        return false;
    }

    private String removeDiacritics(String str) {
        if (str == null) return "";
        String normalized = java.text.Normalizer.normalize(str, java.text.Normalizer.Form.NFD);
        java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
        return pattern.matcher(normalized).replaceAll("")
                .replace("đ", "d").replace("Đ", "d");
    }

    public boolean isEmailAvailable(String email, Long currentUserId) {
        return isEmailAvailable(email, currentUserId, null);
    }

    public boolean isEmailAvailable(String email, Long currentUserId, Long currentVendorId) {
        if (email == null || email.trim().isEmpty()) return false;
        String normalized = email.trim().toLowerCase();
        
        boolean emailExistsInUsers = (currentUserId != null)
                ? userRepository.existsByEmailAndIdNot(normalized, currentUserId)
                : userRepository.existsByEmail(normalized);
        if (emailExistsInUsers) return false;

        boolean emailExistsInShops = (currentVendorId != null)
                ? shopRepository.existsByEmailIgnoreCaseAndVendorIdNot(normalized, currentVendorId)
                : shopRepository.existsByEmailIgnoreCase(normalized);
        return !emailExistsInShops;
    }

    public boolean isPhoneAvailable(String phone, Long currentUserId, Long currentVendorId) {
        if (phone == null || phone.trim().isEmpty()) return false;
        String normalized = phone.trim();
        
        boolean phoneExistsInUsers = (currentUserId != null)
                ? userRepository.existsByPhoneAndIdNot(normalized, currentUserId)
                : userRepository.existsByPhone(normalized);
        if (phoneExistsInUsers) return false;

        boolean phoneExistsInShops = (currentVendorId != null)
                ? shopRepository.existsByPhoneAndVendorIdNot(normalized, currentVendorId)
                : shopRepository.existsByPhone(normalized);
        return !phoneExistsInShops;
    }

    @Transactional(readOnly = true)
    public VendorResponse getMyVendorProfile(Long userId) {
        return vendorRepository.findByUserId(userId)
                .map(VendorResponse::fromEntity)
                .orElse(null);
    }

    private String mergeKycJson(String oldKyc, String newKyc) {
        if (oldKyc == null || oldKyc.isBlank()) return newKyc;
        if (newKyc == null || newKyc.isBlank()) return oldKyc;

        if (oldKyc.trim().startsWith("{") && newKyc.trim().startsWith("{")) {
            try {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                java.util.Map<String, Object> oldMap = mapper.readValue(oldKyc, java.util.Map.class);
                java.util.Map<String, Object> newMap = mapper.readValue(newKyc, java.util.Map.class);

                for (java.util.Map.Entry<String, Object> entry : newMap.entrySet()) {
                    if (entry.getValue() != null && !entry.getValue().toString().isBlank()) {
                        oldMap.put(entry.getKey(), entry.getValue());
                    }
                }
                return mapper.writeValueAsString(oldMap);
            } catch (Exception ignored) {
            }
        }
        return (newKyc != null && !newKyc.isBlank()) ? newKyc : oldKyc;
    }

    @Transactional
    public VendorResponse registerVendor(Long userId, VendorRegisterRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thông tin tài khoản người dùng"));

        Optional<Vendor> existingVendorOpt = vendorRepository.findByUserId(userId);
        Vendor vendor;
        Shop shop;
        Long vendorId = null;

        if (existingVendorOpt.isPresent()) {
            Vendor ev = existingVendorOpt.get();
            if (ev.getApprovalStatus() == ApprovalStatus.APPROVED) {
                throw new IllegalArgumentException("Tài khoản của bạn đã là người bán trên hệ thống, không cần đăng ký lại.");
            }
            // Cho phép cập nhật hồ sơ hiện có khi đang ở trạng thái PENDING, REVISION_NEEDED hoặc REJECTED
            vendor = ev;
            vendorId = ev.getId();
            shop = ev.getShop() != null ? ev.getShop() : new Shop();
        } else {
            vendor = new Vendor();
            vendor.setUser(user);
            shop = new Shop();
        }

        // 1. Kiểm tra trùng tên gian hàng
        if (req.getShopName() != null && !req.getShopName().isBlank()) {
            ShopNameValidationResult valResult = (vendorId != null)
                    ? validateShopName(req.getShopName(), vendorId)
                    : validateShopName(req.getShopName());
            if (!valResult.isAvailable()) {
                throw new IllegalArgumentException(valResult.message());
            }
        }

        // 2. Kiểm tra trùng email nhận thông báo
        if (req.getEmail() != null && !req.getEmail().trim().isEmpty()) {
            String email = req.getEmail().trim().toLowerCase();
            if (!isEmailAvailable(email, userId, vendorId)) {
                throw new IllegalArgumentException("Email nhận thông báo \"" + email + "\" đã được sử dụng trên hệ thống. Vui lòng chọn email khác.");
            }
        }

        // 3. Kiểm tra trùng số điện thoại liên hệ
        if (req.getPhone() != null && !req.getPhone().trim().isEmpty()) {
            String phone = req.getPhone().trim();
            if (!isPhoneAvailable(phone, userId, vendorId)) {
                throw new IllegalArgumentException("Số điện thoại liên hệ \"" + phone + "\" đã được đăng ký bởi người dùng hoặc gian hàng khác. Vui lòng chọn số khác.");
            }
        }

        // 4. Cập nhật Vendor (giữ nguyên dữ liệu cũ, chỉ cập nhật mục có thay đổi / bổ sung)
        if (req.getBusinessName() != null && !req.getBusinessName().isBlank()) {
            vendor.setBusinessName(req.getBusinessName());
        }
        String mergedKyc = mergeKycJson(vendor.getKycDocumentUrl(), req.getKycDocumentUrl());
        vendor.setKycDocumentUrl(mergedKyc);
        vendor.setApprovalStatus(ApprovalStatus.PENDING);
        vendor.setRejectReason(null);

        // 5. Cập nhật Shop
        shop.setVendor(vendor);
        if (req.getShopName() != null && !req.getShopName().isBlank()) {
            shop.setName(req.getShopName().trim());
        }
        if (req.getLogo() != null && !req.getLogo().isBlank()) {
            shop.setLogo(req.getLogo());
        }
        if (req.getBanner() != null && !req.getBanner().isBlank()) {
            shop.setBanner(req.getBanner());
        }
        if (req.getDescription() != null && !req.getDescription().isBlank()) {
            shop.setDescription(req.getDescription());
        }
        if (req.getPickupAddress() != null && !req.getPickupAddress().isBlank()) {
            shop.setPickupAddress(req.getPickupAddress());
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            shop.setPhone(req.getPhone().trim());
        }
        if (req.getEmail() != null && !req.getEmail().isBlank()) {
            shop.setEmail(req.getEmail().trim().toLowerCase());
        }
        shop.setStatus(ShopStatus.INACTIVE); // Chờ duyệt
        if (shop.getRatingAvg() == null) {
            shop.setRatingAvg(BigDecimal.ZERO);
        }

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
        } else if ("NEED_INFO".equalsIgnoreCase(action) || "REVISION_NEEDED".equalsIgnoreCase(action)) {
            vendor.setApprovalStatus(ApprovalStatus.REVISION_NEEDED);
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
