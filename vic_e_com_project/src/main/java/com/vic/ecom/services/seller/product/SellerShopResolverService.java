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

        if (userId == null) {
            return null;
        }

        Optional<Vendor> vendorOpt = vendorRepository.findByUserId(userId);
        if (vendorOpt.isPresent()) {
            Vendor vendor = vendorOpt.get();
            if (vendor.getShop() != null) {
                Shop s = vendor.getShop();
                if ((s.getLogo() == null || s.getLogo().isBlank()) && vendor.getKycDocumentUrl() != null) {
                    String kyc = vendor.getKycDocumentUrl();
                    if (kyc.contains("\"logo\"")) {
                        try {
                            com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(kyc);
                            if (node.has("logo") && !node.get("logo").asText().isBlank()) {
                                s.setLogo(node.get("logo").asText());
                                s = shopRepository.save(s);
                            }
                        } catch (Exception ignored) {}
                    }
                }
                return s;
            }
            Shop s = new Shop();
            s.setVendor(vendor);
            s.setName(vendor.getBusinessName() != null && !vendor.getBusinessName().isBlank()
                    ? vendor.getBusinessName() : "Shop " + userId);
            s.setDescription("Gian hàng mới");
            s.setPickupAddress("");
            s.setBusinessHours("08:00 – 21:00");
            if (vendor.getKycDocumentUrl() != null && vendor.getKycDocumentUrl().contains("\"logo\"")) {
                try {
                    com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(vendor.getKycDocumentUrl());
                    if (node.has("logo") && !node.get("logo").asText().isBlank()) {
                        s.setLogo(node.get("logo").asText());
                    }
                } catch (Exception ignored) {}
            }
            return shopRepository.save(s);
        }

        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
            Vendor vendor = new Vendor();
            vendor.setUser(user);
            vendor.setBusinessName(user.getFullName() != null && !user.getFullName().isBlank()
                    ? user.getFullName() : "Shop " + user.getId());
            vendor.setApprovalStatus(ApprovalStatus.APPROVED);
            vendor = vendorRepository.save(vendor);

            Shop s = new Shop();
            s.setVendor(vendor);
            s.setName(vendor.getBusinessName());
            s.setDescription("Gian hàng của " + user.getFullName());
            s.setPickupAddress("");
            s.setBusinessHours("08:00 – 21:00");
            return shopRepository.save(s);
        }

        return null;
    }
}
