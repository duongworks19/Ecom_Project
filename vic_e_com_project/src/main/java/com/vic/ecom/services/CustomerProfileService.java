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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerProfileService {

    // =========================================================================
    // [CONFIG FLAG - AVATAR UPLOAD DIRECTORY]
    // Change "app.upload.avatar-dir" in application.properties or the default
    // value below to relocate where customer avatar files are stored on disk.
    // =========================================================================
    public static final String DEFAULT_AVATAR_UPLOAD_DIR = "uploads/avatars";
    public static final String AVATAR_URL_PREFIX = "/uploads/avatars/";

    @Value("${app.upload.avatar-dir:" + DEFAULT_AVATAR_UPLOAD_DIR + "}")
    private String avatarUploadDir;

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public User requireActiveCustomer(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated() || authentication.getName() == null) {
            throw CustomerAccountException.unauthorized("Unauthorized");
        }
        String principal = authentication.getName();
        User user = userRepository.findByEmail(principal)
                .or(() -> userRepository.findByPhone(principal))
                .orElseThrow(() -> CustomerAccountException.unauthorized("User not found"));

        if (user.getStatus() == UserStatus.LOCKED || user.getStatus() == UserStatus.PENDING) {
            throw CustomerAccountException.unauthorized("Account is not active");
        }
        if (user.getRole() != UserRole.CUSTOMER && user.getRole() != UserRole.ADMIN && user.getRole() != UserRole.VENDOR) {
            throw CustomerAccountException.forbidden("Customer role required");
        }
        return user;
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(Authentication authentication) {
        return toResponse(requireActiveCustomer(authentication));
    }

    @Transactional
    public ProfileResponse updateProfile(Authentication authentication, UpdateProfileRequest request) {
        User user = requireActiveCustomer(authentication);
        if (request == null) {
            throw CustomerAccountException.badRequest("INVALID_REQUEST", "Request body is required", null);
        }
        if (!CustomerAccountValidator.isValidFullName(request.fullName())) {
            throw CustomerAccountException.badRequest(
                    "INVALID_FULL_NAME", "Họ và tên phải từ 2 đến 100 ký tự", "fullName");
        }
        String normalizedPhone = CustomerAccountValidator.normalizePhone(request.phone());
        if (!CustomerAccountValidator.isValidVnPhone(normalizedPhone)) {
            throw CustomerAccountException.badRequest(
                    "INVALID_PHONE", "Số điện thoại Việt Nam không hợp lệ", "phone");
        }

        userRepository.findByPhone(normalizedPhone).ifPresent(other -> {
            if (!other.getId().equals(user.getId())) {
                throw CustomerAccountException.conflict(
                        "PHONE_ALREADY_IN_USE", "Số điện thoại đã được sử dụng bởi tài khoản khác", "phone");
            }
        });

        user.setFullName(request.fullName().trim());
        user.setPhone(normalizedPhone);
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public AvatarResponse updateAvatar(Authentication authentication, MultipartFile file) {
        User user = requireActiveCustomer(authentication);
        if (file == null || file.isEmpty()) {
            throw CustomerAccountException.badRequest("EMPTY_FILE", "Vui lòng chọn ảnh đại diện", "file");
        }
        if (file.getSize() > CustomerAccountValidator.MAX_AVATAR_BYTES) {
            throw CustomerAccountException.unprocessable(
                    "AVATAR_TOO_LARGE", "Dung lượng ảnh tối đa là 1MB", "file");
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw CustomerAccountException.badRequest("FILE_READ_ERROR", "Không thể đọc file ảnh", "file");
        }

        if (bytes.length > CustomerAccountValidator.MAX_AVATAR_BYTES) {
            throw CustomerAccountException.unprocessable(
                    "AVATAR_TOO_LARGE", "Dung lượng ảnh tối đa là 1MB", "file");
        }

        String ext = CustomerAccountValidator.detectImageExtension(bytes);
        if (ext == null) {
            throw CustomerAccountException.unprocessable(
                    "UNSUPPORTED_AVATAR_FORMAT", "Chỉ hỗ trợ định dạng ảnh JPEG hoặc PNG", "file");
        }

        String filename = user.getId() + "_" + UUID.randomUUID().toString().replace("-", "") + "." + ext;
        Path dirPath = Paths.get(avatarUploadDir).toAbsolutePath().normalize();
        Path targetPath = dirPath.resolve(filename).normalize();

        try {
            Files.createDirectories(dirPath);
            Files.write(targetPath, bytes);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store avatar file", e);
        }

        String previousAvatarUrl = user.getAvatarUrl();
        String newAvatarUrl = AVATAR_URL_PREFIX + filename;
        user.setAvatarUrl(newAvatarUrl);
        userRepository.saveAndFlush(user);

        deleteOldAvatarSilently(dirPath, previousAvatarUrl);
        return new AvatarResponse(newAvatarUrl);
    }

    private void deleteOldAvatarSilently(Path dirPath, String previousAvatarUrl) {
        if (previousAvatarUrl == null || !previousAvatarUrl.startsWith(AVATAR_URL_PREFIX)) {
            return;
        }
        String oldFileName = previousAvatarUrl.substring(AVATAR_URL_PREFIX.length());
        if (oldFileName.isBlank() || oldFileName.contains("/") || oldFileName.contains("\\") || oldFileName.contains("..")) {
            return;
        }
        try {
            Files.deleteIfExists(dirPath.resolve(oldFileName).normalize());
        } catch (IOException ignored) {
            // Best-effort cleanup after DB update succeeded
        }
    }

    private ProfileResponse toResponse(User user) {
        return new ProfileResponse(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getAvatarUrl()
        );
    }
}
