package com.vic.ecom.services;

import com.vic.ecom.entity.PasswordResetToken;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.PasswordResetTokenRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.OtpCodec;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    static final String PURPOSE = "EMAIL_VERIFICATION";
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_TTL_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_RESENDS_PER_HOUR = 3;
    private static final String OTP_INVALID_MSG = "Mã không đúng hoặc đã hết hạn";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final MailService mailService;

    @Value("${app.otp.secret:4c8a9e1f5b2d7e3a6c0b8f4e2d9a1c5b7e3f6a8d0c2e4b6a8f1e3d5c7b9a0f2e}")
    private String otpSecret;

    /** Issues a fresh OTP for a Customer, invalidating any unused codes. Always silent. */
    @Transactional
    public void issueAndSend(User user) {
        tokenRepository.invalidateUnusedByUser(user, LocalDateTime.now());
        String code = OtpCodec.generateCode();
        PasswordResetToken t = new PasswordResetToken();
        t.setUser(user);
        t.setToken(OtpCodec.hash(user.getId(), PURPOSE, code, otpSecret));
        t.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        tokenRepository.save(t);
        mailService.sendOtp(user.getEmail(), code);
    }

    /** POST /api/auth/verify-email — always the same 400 on any failure. */
    @Transactional
    public void verify(String email, String otp) {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        PasswordResetToken t = user == null ? null : tokenRepository
                .findTopByUserOrderByCreatedAtDesc(user).orElse(null);
        if (t == null || t.isExpired() || t.isUsed()) {
            throw invalid();
        }
        // Reserve an attempt BEFORE comparing to block parallel guessing.
        if (tokenRepository.incrementAttemptIfAllowed(t.getId(), LocalDateTime.now()) == 0) {
            throw invalid();
        }
        if (!OtpCodec.matches(user.getId(), PURPOSE, otp, t.getToken(), otpSecret)) {
            throw invalid();
        }
        if (tokenRepository.markUsed(t.getId(), LocalDateTime.now()) == 0) {
            throw invalid();
        }
        // Only PENDING → ACTIVE; never unlock a LOCKED account.
        userRepository.updateStatusIf(user.getId(), UserStatus.PENDING, UserStatus.ACTIVE);
    }

    /** POST /api/auth/resend-verification — always 204, silently skipping when throttled. */
    @Transactional
    public void resend(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null || user.getRole() != UserRole.CUSTOMER || user.getStatus() != UserStatus.PENDING) {
            return;
        }
        LocalDateTime now = LocalDateTime.now();
        if (tokenRepository.countByUserAndCreatedAtAfter(user, now.minusHours(1)) >= MAX_RESENDS_PER_HOUR) {
            return;
        }
        PasswordResetToken latest = tokenRepository.findTopByUserOrderByCreatedAtDesc(user).orElse(null);
        if (latest != null && latest.getCreatedAt().isAfter(now.minusSeconds(RESEND_COOLDOWN_SECONDS))) {
            return;
        }
        issueAndSend(user);
    }

    private CustomerAccountException invalid() {
        return CustomerAccountException.badRequest("OTP_INVALID", OTP_INVALID_MSG, "otp");
    }
}
