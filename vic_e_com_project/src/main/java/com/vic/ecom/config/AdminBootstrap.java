package com.vic.ecom.config;

import com.vic.ecom.entity.User;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${ADMIN_EMAIL:}")
    private String adminEmail;

    @Value("${ADMIN_INITIAL_PASSWORD:}")
    private String adminInitialPassword;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("ALTER TABLE vouchers ALTER COLUMN shop_id DROP NOT NULL");
        } catch (Exception ignored) {
        }

        if (userRepository.existsByRole(UserRole.ADMIN)) {
            return;
        }
        if (adminEmail == null || adminEmail.isBlank()
                || adminInitialPassword == null || adminInitialPassword.isBlank()) {
            log.warn("No ADMIN user exists and ADMIN_EMAIL / ADMIN_INITIAL_PASSWORD are not set; skipping admin bootstrap.");
            return;
        }

        User admin = new User();
        admin.setEmail(adminEmail.trim());
        admin.setFullName("System Admin");
        admin.setPasswordHash(passwordEncoder.encode(adminInitialPassword));
        admin.setRole(UserRole.ADMIN);
        admin.setStatus(UserStatus.ACTIVE);
        admin.setAuthProvider("LOCAL");
        userRepository.save(admin);
        log.info("Bootstrapped initial ADMIN account for {}", admin.getEmail());
    }
}
