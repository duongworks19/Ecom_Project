package com.vic.ecom.services;

import com.vic.ecom.dto.vendor.ShopResponse;
import com.vic.ecom.entity.Shop;
import com.vic.ecom.enums.ShopStatus;
import com.vic.ecom.repository.ShopRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final ShopRepository shopRepository;

    @Transactional(readOnly = true)
    public ShopResponse getShopById(Long id) {
        return shopRepository.findById(id)
                .map(ShopResponse::fromEntity)
                .orElse(null);
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
}
