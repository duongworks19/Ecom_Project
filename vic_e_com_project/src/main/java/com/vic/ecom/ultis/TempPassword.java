package com.vic.ecom.ultis;

import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public final class TempPassword {
    private static final String UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final String LOWER = "abcdefghijkmnopqrstuvwxyz";
    private static final String DIGITS = "23456789";
    private static final String ALL = UPPER + LOWER + DIGITS;
    private static final SecureRandom RANDOM = new SecureRandom();

    private TempPassword() { }

    public static String generate() {
        List<Character> chars = new ArrayList<>();
        chars.add(pick(UPPER));
        chars.add(pick(LOWER));
        chars.add(pick(DIGITS));
        while (chars.size() < 12) chars.add(pick(ALL));
        Collections.shuffle(chars, RANDOM);
        StringBuilder result = new StringBuilder(12);
        chars.forEach(result::append);
        return result.toString();
    }

    private static char pick(String source) { return source.charAt(RANDOM.nextInt(source.length())); }
}
