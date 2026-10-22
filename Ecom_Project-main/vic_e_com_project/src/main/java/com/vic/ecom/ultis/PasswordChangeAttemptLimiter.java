package com.vic.ecom.ultis;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.ConcurrentHashMap;

public class PasswordChangeAttemptLimiter {
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);
    private final ConcurrentHashMap<String, Entry> attempts = new ConcurrentHashMap<>();

    public boolean isBlocked(String account) {
        Entry entry = attempts.get(account);
        return entry != null && !entry.expired() && entry.count >= MAX_ATTEMPTS;
    }

    public void recordFailure(String account) {
        attempts.compute(account, (key, old) -> {
            if (old == null || old.expired()) return new Entry(1, Instant.now());
            return new Entry(old.count + 1, old.startedAt);
        });
    }

    public void clear(String account) {
        attempts.remove(account);
    }

    private record Entry(int count, Instant startedAt) {
        private boolean expired() {
            return startedAt.plus(WINDOW).isBefore(Instant.now());
        }
    }
}
