package com.vic.ecom.services;

import com.vic.ecom.dto.AuthResponse;
import com.vic.ecom.dto.LoginRequest;
import com.vic.ecom.dto.RegisterRequest;
import com.vic.ecom.entity.LoginHistory;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.LoginStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.LoginHistoryRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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
        return new AuthResponse(token, user.getRole().name(), user.getId(), user.getFullName(), subject);
    }

    private void recordLogin(User user, LoginStatus status) {
        LoginHistory log = new LoginHistory();
        log.setUser(user);
        log.setStatus(status);
        loginHistoryRepository.save(log);
    }
}
