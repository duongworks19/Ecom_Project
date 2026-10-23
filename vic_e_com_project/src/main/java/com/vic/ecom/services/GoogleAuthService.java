package com.vic.ecom.services;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.vic.ecom.dto.AuthResponse;
import com.vic.ecom.entity.LoginHistory;
import com.vic.ecom.entity.User;
import com.vic.ecom.enums.LoginStatus;
import com.vic.ecom.enums.UserRole;
import com.vic.ecom.enums.UserStatus;
import com.vic.ecom.repository.LoginHistoryRepository;
import com.vic.ecom.repository.UserRepository;
import com.vic.ecom.ultis.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class GoogleAuthService {

    private static final String GOOGLE_PROVIDER = "GOOGLE";

    private final UserRepository userRepository;
    private final LoginHistoryRepository loginHistoryRepository;
    private final JwtUtil jwtUtil;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Transactional
    public AuthResponse login(String idToken) {
        GoogleIdToken.Payload payload = verify(idToken);
        String providerSubject = payload.getSubject();
        String email = payload.getEmail();

        if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
            throw new BadCredentialsException("Google email is not verified");
        }

        User user = userRepository.findByAuthProviderAndProviderSubject(GOOGLE_PROVIDER, providerSubject)
                .orElseGet(() -> findOrLinkExistingUser(payload, providerSubject));

        if (user.getStatus() == UserStatus.LOCKED) {
            recordLogin(user, LoginStatus.FAILED);
            throw new BadCredentialsException("Account is locked");
        }

        if (user.getStatus() == UserStatus.PENDING) {
            recordLogin(user, LoginStatus.FAILED);
            throw new BadCredentialsException("Account pending approval");
        }

        if (user.getTokenVersion() == null) {
            user.setTokenVersion(1);
            userRepository.save(user);
        }

        recordLogin(user, LoginStatus.SUCCESS);
        String subject = user.getEmail() != null ? user.getEmail() : email;
        String token = jwtUtil.generateToken(user.getId(), subject, user.getRole().name(), user.getTokenVersion());
        AuthResponse response = new AuthResponse(token, user.getRole().name(), user.getId(), user.getFullName(), subject);
        response.setMustChangePassword(user.isMustChangePassword());
        return response;
    }

    private GoogleIdToken.Payload verify(String idToken) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalStateException("Google Client ID is not configured");
        }

        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(), GsonFactory.getDefaultInstance())
                .setAudience(Collections.singletonList(googleClientId))
                .build();

        try {
            GoogleIdToken token = verifier.verify(idToken);
            if (token == null) {
                throw new BadCredentialsException("Invalid Google ID token");
            }
            return token.getPayload();
        } catch (GeneralSecurityException | IOException e) {
            throw new BadCredentialsException("Invalid Google ID token");
        }
    }

    private User findOrLinkExistingUser(GoogleIdToken.Payload payload, String providerSubject) {
        String email = payload.getEmail();
        if (email == null || email.isBlank()) {
            throw new BadCredentialsException("Google account does not provide an email");
        }

        User user = userRepository.findByEmail(email).orElse(null);
        if (user != null) {
            if (user.getProviderSubject() != null && !providerSubject.equals(user.getProviderSubject())) {
                throw new BadCredentialsException("Google account is not linked to this user");
            }
            // Link only the verified Google subject. Preserve LOCAL provider, role,
            // password, shipper profile, and mustChangePassword state.
            user.setProviderSubject(providerSubject);
            return userRepository.save(user);
        }

        return createGoogleUser(payload, providerSubject);
    }

    private User createGoogleUser(GoogleIdToken.Payload payload, String providerSubject) {
        String email = payload.getEmail();
        User user = new User();
        user.setEmail(email);
        user.setFullName((String) payload.get("name"));
        user.setAvatarUrl((String) payload.get("picture"));
        user.setAuthProvider(GOOGLE_PROVIDER);
        user.setProviderSubject(providerSubject);
        user.setRole(UserRole.CUSTOMER);
        user.setStatus(UserStatus.ACTIVE);
        return userRepository.save(user);
    }

    private void recordLogin(User user, LoginStatus status) {
        LoginHistory log = new LoginHistory();
        log.setUser(user);
        log.setStatus(status);
        loginHistoryRepository.save(log);
    }
}
