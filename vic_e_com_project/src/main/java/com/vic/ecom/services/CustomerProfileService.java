package com.vic.ecom.services;

import com.vic.ecom.dto.ProfileDtos.AvatarResponse;
import com.vic.ecom.dto.ProfileDtos.ProfileResponse;
import com.vic.ecom.dto.ProfileDtos.UpdateProfileRequest;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.CustomerAccountValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class CustomerProfileService {
    private final UserRepository userRepository;
    private final CloudinaryMediaService cloudinaryMediaService;

    @Transactional(readOnly = true)
    public User requireActiveCustomer(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) throw CustomerAccountException.unauthorized("Unauthorized");
        User user = userRepository.findByEmail(authentication.getName()).or(() -> userRepository.findByPhone(authentication.getName())).orElseThrow(() -> CustomerAccountException.unauthorized("User not found"));
        if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.PENDING) throw CustomerAccountException.unauthorized("Account is not active");
        if (user.getRole() != UserRole.CUSTOMER && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.VENDOR) throw CustomerAccountException.forbidden("Customer role required");
        return user;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Authentication authentication) { return toResponse(requireActiveCustomer(authentication)); }

    @Transactional
    public ProfileResponse updateProfile(Authentication authentication, UpdateProfileRequest request) {
        User user = requireActiveCustomer(authentication);
        if (request == null) throw CustomerAccountException.badRequest("INVALID_REQUEST", "Request body is required", null);
        if (!CustomerAccountValidator.isValidFullName(request.fullName())) throw CustomerAccountException.badRequest("INVALID_FULL_NAME", "Họ và tên không hợp lệ", "fullName");
        String phone = CustomerAccountValidator.normalizePhone(request.phone());
        if (!CustomerAccountValidator.isValidVnPhone(phone)) throw CustomerAccountException.badRequest("INVALID_PHONE", "Số điện thoại không hợp lệ", "phone");
        userRepository.findByPhone(phone).ifPresent(other -> { if (!other.getId().equals(user.getId())) throw CustomerAccountException.conflict("PHONE_ALREADY_IN_USE", "Số điện thoại đã được sử dụng", "phone"); });
        user.setFullName(request.fullName().trim()); user.setPhone(phone);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AvatarResponse updateAvatar(Authentication authentication, MultipartFile file) {
        User user = requireActiveCustomer(authentication);
        if (file == null || file.isEmpty()) throw CustomerAccountException.badRequest("EMPTY_FILE", "Vui lòng chọn ảnh đại diện", "file");
        try {
            String url = cloudinaryMediaService.uploadImage(file, "vicmart/avatars/" + user.getId(), CustomerAccountValidator.MAX_AVATAR_BYTES);
            user.setAvatarUrl(url); userRepository.saveAndFlush(user); return new AvatarResponse(url);
        } catch (Exception e) { throw CustomerAccountException.unprocessable("AVATAR_UPLOAD_FAILED", e.getMessage(), "file"); }
    }

    private ProfileResponse toResponse(User user) { return new ProfileResponse(user.getId(), user.getFullName(), user.getEmail(), user.getPhone(), user.getAvatarUrl()); }
}
