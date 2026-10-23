package com.vic.ecom.services.seller.product;

import com.vic.ecom.entity.Shop;
import com.vic.ecom.entity.User;
import com.vic.ecom.entity.Vendor;
import com.vic.ecom.enums.ApprovalStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.ShopRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class SellerShopResolverService {

    private final ShopRepository shopRepository;
    private final VendorRepository vendorRepository;
    private final UserRepository userRepository;

    @Transactional
    public Shop resolveCurrentShop(Authentication auth, Long fallbackUserId) {
        Long userId = fallbackUserId;
        if (auth != null && auth.getName() != null) {
            String principal = auth.getName();
            Optional<User> uOpt = userRepository.findByEmail(principal).or(() -> userRepository.findByPhone(principal));
            if (uOpt.isPresent()) {
                userId = uOpt.get().getId();
            }
        }

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
            final Long finalUserId = userId;
            User sellerUser = (finalUserId != null) ? userRepository.findById(finalUserId).orElse(null) : null;
            if (sellerUser == null) {
                sellerUser = userRepository.findByEmail("seller@lumihomedecor.vn")
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
            }

            final User targetUser = sellerUser;
            Vendor vendor = vendorRepository.findByUserId(targetUser.getId())
                    .orElseGet(() -> {
                        Vendor v = new Vendor();
                        v.setUser(targetUser);
                        v.setBusinessName("Lumi Home Decor Co., Ltd.");
                        v.setApprovalStatus(ApprovalStatus.APPROVED);
                        return vendorRepository.save(v);
                    });

            if (vendor.getShop() != null) {
                shop = vendor.getShop();
            } else {
                Shop s = new Shop();
                s.setVendor(vendor);
                s.setName("Lumi Home Decor");
                s.setDescription("Đồ decor phong cách tối giản Bắc Âu.");
                s.setPickupAddress("Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội");
                shop = shopRepository.save(s);
            }
        }

        return shop;
    }
}
