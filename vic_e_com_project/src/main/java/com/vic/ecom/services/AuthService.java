package com.vic.ecom.services;

import com.vic.ecom.dto.AuthResponse;
import com.vic.ecom.dto.LoginRequest;
import com.vic.ecom.dto.RegisterRequest;
import com.vic.ecom.dto.ChangePasswordRequest;
import com.vic.ecom.entity.LoginHistory;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.LoginStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.LoginHistoryRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.JwtUtil;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.PasswordChangeAttemptLimiter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_BCRYPT_BYTES = 72;
    private static final PasswordChangeAttemptLimiter CHANGE_PASSWORD_LIMITER = new PasswordChangeAttemptLimiter();

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public void changePassword(String account, ChangePasswordRequest req) {
        User user = userRepository.findByEmail(account).or(() -> userRepository.findByPhone(account))
                .orElseThrow(() -> CustomerAccountException.unauthorized("Unauthorized"));
        if (CHANGE_PASSWORD_LIMITER.isBlocked(account)) {
            throw new CustomerAccountException(429, "TOO_MANY_ATTEMPTS", "Quá nhiều lần thử, vui lòng thử lại sau", null);
        }
        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw CustomerAccountException.conflict("NO_PASSWORD_SET", "Tài khoản chưa có mật khẩu", null);
        }
        if (req == null || req.currentPassword() == null || req.currentPassword().isEmpty()) {
            throw CustomerAccountException.badRequest("CURRENT_PASSWORD_REQUIRED", "Mật khẩu hiện tại là bắt buộc", "currentPassword");
        }
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            CHANGE_PASSWORD_LIMITER.recordFailure(account);
            throw CustomerAccountException.badRequest("CURRENT_PASSWORD_INCORRECT", "Mật khẩu hiện tại không chính xác", "currentPassword");
        }
        validateNewPassword(req.newPassword(), user.getPasswordHash());
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        CHANGE_PASSWORD_LIMITER.clear(account);
    }

    private void validateNewPassword(String password, String currentHash) {
        if (password == null || password.isEmpty() || password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > MAX_BCRYPT_BYTES
                || password.length() < 8 || !password.matches(".*[A-Z].*") || !password.matches(".*[a-z].*")
                || !password.matches(".*\\d.*") || passwordEncoder.matches(password, currentHash)) {
            throw CustomerAccountException.unprocessable("PASSWORD_POLICY", "Mật khẩu mới phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, chữ số, tối đa 72 byte và không trùng mật khẩu hiện tại", "newPassword");
        }
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (req.getPhone() != null && !req.getPhone().isBlank()
                && userRepository.existsByPhone(req.getPhone())) {
            throw new IllegalArgumentException("Phone already registered");
        }

        User user = new User();
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPhone(req.getPhone());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getRole().name(), user.getId(), user.getFullName(), user.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getUsername())
                .or(() -> userRepository.findByPhone(req.getUsername()))
                .orElse(null);

        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            if (user != null) recordLogin(user, LoginStatus.FAILED);
            throw new BadCredentialsException("Invalid credentials");
        }

        if (user.getStatus() == UserStatus.LOCKED) {
            recordLogin(user, LoginStatus.FAILED);
            throw new BadCredentialsException("Account is locked");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            recordLogin(user, LoginStatus.FAILED);
            throw new BadCredentialsException("Account pending approval");
        }

        recordLogin(user, LoginStatus.SUCCESS);
        String subject = user.getEmail() != null ? user.getEmail() : user.getPhone();
        String token = jwtUtil.generateToken(subject, user.getRole().name());
        AuthResponse response = new AuthResponse(token, user.getRole().name(), user.getId(), user.getFullName(), subject);
        response.setMustChangePassword(user.isMustChangePassword());
        return response;
    }

    private void recordLogin(User user, LoginStatus status) {
        LoginHistory log = new LoginHistory();
        log.setUser(user);
        log.setStatus(status);
        loginHistoryRepository.save(log);
    }
}
