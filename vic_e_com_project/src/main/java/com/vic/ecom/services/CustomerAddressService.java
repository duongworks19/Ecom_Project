package com.vic.ecom.services;

import com.vic.ecom.dto.AddressDtos.AddressResponse;
import com.vic.ecom.dto.AddressDtos.UpsertAddressRequest;
import com.vic.ecom.entity.Address;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.AddressRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.CustomerAccountValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomerAddressService {

    private final AddressRepository addressRepository;
    private final CustomerProfileService profileService;

    @Transactional(readOnly = true)
    public List<AddressResponse> listAddresses(Authentication auth) {
        User customer = profileService.requireActiveCustomer(auth);
        return addressRepository.findAllByUserIdSorted(customer.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AddressResponse createAddress(Authentication auth, UpsertAddressRequest req) {
        User customer = profileService.requireActiveCustomer(auth);
        String normalizedPhone = validateRequest(req);

        long existingCount = addressRepository.countByUser_Id(customer.getId());
        boolean makeDefault = (existingCount == 0) || Boolean.TRUE.equals(req.isDefault());
        if (makeDefault && existingCount > 0) {
            unsetOtherDefaults(customer.getId(), null);
        }

        Address address = new Address();
        address.setUser(customer);
        address.setReceiverName(req.recipientName().trim());
        address.setPhone(normalizedPhone);
        address.setAddressDetail(CustomerAccountValidator.formatAddressDetail(
                req.streetAddress(), req.ward(), req.district(), req.province()));
        address.setDefault(makeDefault);

        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse updateAddress(Authentication auth, Long addressId, UpsertAddressRequest req) {
        User customer = profileService.requireActiveCustomer(auth);
        Address address = requireOwnedAddress(customer.getId(), addressId);
        String normalizedPhone = validateRequest(req);

        if (Boolean.TRUE.equals(req.isDefault()) && !address.isDefault()) {
            unsetOtherDefaults(customer.getId(), address.getId());
            address.setDefault(true);
        } else if (Boolean.FALSE.equals(req.isDefault()) && address.isDefault()) {
            // Keep invariant: cannot unset the sole default without picking another default
            long total = addressRepository.countByUser_Id(customer.getId());
            if (total <= 1) {
                address.setDefault(true);
            }
        }

        address.setReceiverName(req.recipientName().trim());
        address.setPhone(normalizedPhone);
        address.setAddressDetail(CustomerAccountValidator.formatAddressDetail(
                req.streetAddress(), req.ward(), req.district(), req.province()));

        return toResponse(addressRepository.save(address));
    }

    @Transactional
    public AddressResponse setDefaultAddress(Authentication auth, Long addressId) {
        User customer = profileService.requireActiveCustomer(auth);
        Address address = requireOwnedAddress(customer.getId(), addressId);

        unsetOtherDefaults(customer.getId(), address.getId());
        address.setDefault(true);
        return toResponse(addressRepository.save(address));
    }

    private void unsetOtherDefaults(Long userId, Long excludeId) {
        for (Address existing : addressRepository.findAllByUserIdSorted(userId)) {
            if (existing.isDefault() && (excludeId == null || !excludeId.equals(existing.getId()))) {
                existing.setDefault(false);
                addressRepository.save(existing);
            }
        }
    }

    @Transactional
    public void deleteAddress(Authentication auth, Long addressId) {
        User customer = profileService.requireActiveCustomer(auth);
        Address address = requireOwnedAddress(customer.getId(), addressId);
        if (address.isDefault()) {
            throw CustomerAccountException.conflict(
                    "CANNOT_DELETE_DEFAULT_ADDRESS",
                    "Không thể xóa địa chỉ mặc định. Vui lòng chọn địa chỉ khác làm mặc định trước.",
                    "isDefault");
        }
        addressRepository.delete(address);
    }

    private Address requireOwnedAddress(Long customerId, Long addressId) {
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> CustomerAccountException.notFound(
                        "ADDRESS_NOT_FOUND", "Không tìm thấy địa chỉ"));
        if (address.getUser() == null || !customerId.equals(address.getUser().getId())) {
            throw CustomerAccountException.forbidden("Bạn không có quyền thao tác trên địa chỉ này");
        }
        return address;
    }

    private String validateRequest(UpsertAddressRequest req) {
        if (req == null) {
            throw CustomerAccountException.badRequest("INVALID_REQUEST", "Dữ liệu địa chỉ không hợp lệ", null);
        }
        if (!CustomerAccountValidator.isValidFullName(req.recipientName())) {
            throw CustomerAccountException.badRequest(
                    "INVALID_RECIPIENT_NAME", "Tên người nhận phải từ 2 đến 100 ký tự", "recipientName");
        }
        String normalizedPhone = CustomerAccountValidator.normalizePhone(req.phone());
        if (!CustomerAccountValidator.isValidVnPhone(normalizedPhone)) {
            throw CustomerAccountException.badRequest(
                    "INVALID_PHONE", "Số điện thoại người nhận không hợp lệ", "phone");
        }
        requireText(req.streetAddress(), 255, "streetAddress", "Địa chỉ cụ thể không hợp lệ");
        requireText(req.ward(), 100, "ward", "Phường/Xã không hợp lệ");
        requireText(req.district(), 100, "district", "Quận/Huyện không hợp lệ");
        requireText(req.province(), 100, "province", "Tỉnh/Thành phố không hợp lệ");
        return normalizedPhone;
    }

    private void requireText(String val, int maxLen, String field, String message) {
        if (val == null || val.trim().isEmpty() || val.trim().length() > maxLen) {
            throw CustomerAccountException.badRequest("INVALID_" + field.toUpperCase(), message, field);
        }
    }

    private AddressResponse toResponse(Address address) {
        String[] parts = CustomerAccountValidator.parseAddressDetail(address.getAddressDetail());
        return new AddressResponse(
                address.getId(),
                address.getReceiverName(),
                address.getPhone(),
                parts[0],
                parts[1],
                parts[2],
                parts[3],
                address.isDefault()
        );
    }
}
