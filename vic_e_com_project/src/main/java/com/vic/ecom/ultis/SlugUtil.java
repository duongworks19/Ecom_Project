package com.vic.ecom.ultis;

import java.text.Normalizer;
import java.util.Locale;

public final class SlugUtil {
    private SlugUtil() {}
    public static String toSlug(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD).replaceAll("\\p{M}", "").toLowerCase(Locale.ROOT).replace('đ', 'd').replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }
}
