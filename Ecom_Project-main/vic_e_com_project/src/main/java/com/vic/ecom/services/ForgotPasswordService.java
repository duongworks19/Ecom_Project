package com.vic.ecom.services;

import com.vic.ecom.entity.PasswordResetToken;
import com.vic.ecom.entity.User;
import com.vic.ecom.repository.PasswordResetTokenRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.CustomerAccountException;
import com.vic.ecom.ultis.OtpCodec;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class ForgotPasswordService {

    static final String PURPOSE = "PASSWORD_RESET";
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_TTL_MINUTES = 10;
    private static final int RESEND_COOLDOWN_SECONDS = 60;
    private static final int MAX_RESENDS_PER_HOUR = 3;
    private static final String OTP_INVALID_MSG = "Mã không đúng hoặc đã hết hạn";

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final MailService mailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.otp.secret:4a92c10b749d6823c9a419823ef0b7a8d56b025d7426e257bc516147253fa432}")
    private String otpSecret;

    /** POST /api/auth/forgot-password — always 204, silently skipping unknown emails. */
    @Transactional
    public void requestOtp(String email) {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        if (user == null) return;

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

    /** POST /api/auth/verify-otp — validate OTP without consuming it (reset-password will consume). */
    @Transactional
    public void verifyOtp(String email, String otp) {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        PasswordResetToken t = user == null ? null : tokenRepository
                .findTopByUserOrderByCreatedAtDesc(user).orElse(null);
        if (t == null || t.isExpired() || t.isUsed()) {
            throw invalid();
        }
        if (tokenRepository.incrementAttemptIfAllowed(t.getId(), LocalDateTime.now()) == 0) {
            throw invalid();
        }
        if (!OtpCodec.matches(user.getId(), PURPOSE, otp, t.getToken(), otpSecret)) {
            throw invalid();
        }
        // Do NOT mark used here — reset-password will consume it.
    }

    /** POST /api/auth/reset-password — always the same 400 on any failure. */
    @Transactional
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        PasswordResetToken t = user == null ? null : tokenRepository
                .findTopByUserOrderByCreatedAtDesc(user).orElse(null);
        if (t == null || t.isExpired() || t.isUsed()) {
            throw invalid();
        }
        if (tokenRepository.incrementAttemptIfAllowed(t.getId(), LocalDateTime.now()) == 0) {
            throw invalid();
        }
        if (!OtpCodec.matches(user.getId(), PURPOSE, otp, t.getToken(), otpSecret)) {
            throw invalid();
        }
        if (tokenRepository.markUsed(t.getId(), LocalDateTime.now()) == 0) {
            throw invalid();
        }
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    private void issueAndSend(User user) {
        tokenRepository.invalidateUnusedByUser(user, LocalDateTime.now());
        String code = OtpCodec.generateCode();
        PasswordResetToken t = new PasswordResetToken();
        t.setUser(user);
        t.setToken(OtpCodec.hash(user.getId(), PURPOSE, code, otpSecret));
        t.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_TTL_MINUTES));
        tokenRepository.save(t);
        mailService.sendOtp(user.getEmail(), code);
    }

    private CustomerAccountException invalid() {
        return CustomerAccountException.badRequest("OTP_INVALID", OTP_INVALID_MSG, "otp");
    }
}
