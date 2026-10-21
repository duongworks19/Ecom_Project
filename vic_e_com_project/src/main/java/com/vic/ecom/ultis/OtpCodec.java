package com.vic.ecom.ultis;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.HexFormat;

/**
 * Generates 6-digit OTP codes and HMAC-SHA256 hashes them so the raw code is never stored.
 * The purpose string is bound into the HMAC input, so an email-verification code can never
 * be replayed as a password-reset code (or vice versa) once a purpose column exists.
 */
public final class OtpCodec {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String HMAC_ALGO = "HmacSHA256";

    private OtpCodec() {
    }

    /** Returns a zero-padded 6-digit code, e.g. "004217". */
    public static String generateCode() {
        return String.format("%06d", RANDOM.nextInt(1_000_000));
    }

    /** HMAC-SHA256 hex digest (64 chars) of {@code userId:purpose:code} keyed by {@code secret}. */
    public static String hash(long userId, String purpose, String code, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] digest = mac.doFinal((userId + ":" + purpose + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC unavailable", e);
        }
    }

    /** Constant-time comparison of the expected hash against the hash of the submitted code. */
    public static boolean matches(long userId, String purpose, String code, String expectedHash, String secret) {
        if (code == null || !code.matches("\\d{6}")) {
            return false;
        }
        byte[] expected = expectedHash.getBytes(StandardCharsets.UTF_8);
        byte[] actual = hash(userId, purpose, code, secret).getBytes(StandardCharsets.UTF_8);
        return MessageDigest.isEqual(expected, actual);
    }
}
