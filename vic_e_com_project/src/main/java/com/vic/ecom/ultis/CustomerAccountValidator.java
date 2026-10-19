package com.vic.ecom.ultis;

import com.vic.ecom.enums.OrderStatus;

import java.util.List;

/**
 * Pure utility for Vietnamese phone normalization/validation,
 * magic-byte image detection (JPEG/PNG), and customer order status mapping.
 */
public final class CustomerAccountValidator {

    private static final String VN_PHONE_REGEX = "^0(3|5|7|8|9)\\d{8}$";
    public static final long MAX_AVATAR_BYTES = 1_048_576L; // 1 MB

    private CustomerAccountValidator() {
    }

    /**
     * Normalizes a Vietnamese phone number: trims spaces/dots/dashes and converts +84 or 84 prefix to 0.
     */
    public static String normalizePhone(String raw) {
        if (raw == null) {
            return "";
        }
        String compact = raw.trim().replaceAll("[\\s.\\-()]", "");
        if (compact.startsWith("+84")) {
            return "0" + compact.substring(3);
        }
        if (compact.startsWith("84") && compact.length() == 11) {
            return "0" + compact.substring(2);
        }
        return compact;
    }

    public static boolean isValidVnPhone(String normalizedPhone) {
        return normalizedPhone != null && normalizedPhone.matches(VN_PHONE_REGEX);
    }

    public static boolean isValidFullName(String name) {
        if (name == null) {
            return false;
        }
        int len = name.trim().length();
        return len >= 2 && len <= 100;
    }

    public static boolean isValidCancelReason(String reason) {
        if (reason == null) {
            return false;
        }
        int len = reason.trim().length();
        return len >= 5 && len <= 300;
    }

    /**
     * Detects image format solely from magic bytes (never trusts client extension/Content-Type).
     * Returns "jpg" for JPEG (FF D8 FF), "png" for PNG (89 50 4E 47 0D 0A 1A 0A), or null if unsupported.
     */
    public static String detectImageExtension(byte[] bytes) {
        if (bytes == null || bytes.length < 4) {
            return null;
        }
        // JPEG: FF D8 FF
        if ((bytes[0] & 0xFF) == 0xFF
                && (bytes[1] & 0xFF) == 0xD8
                && (bytes[2] & 0xFF) == 0xFF) {
            return "jpg";
        }
        // PNG: 89 50 4E 47 0D 0A 1A 0A
        if (bytes.length >= 8
                && (bytes[0] & 0xFF) == 0x89
                && (bytes[1] & 0xFF) == 0x50
                && (bytes[2] & 0xFF) == 0x4E
                && (bytes[3] & 0xFF) == 0x47
                && (bytes[4] & 0xFF) == 0x0D
                && (bytes[5] & 0xFF) == 0x0A
                && (bytes[6] & 0xFF) == 0x1A
                && (bytes[7] & 0xFF) == 0x0A) {
            return "png";
        }
        return null;
    }

    /**
     * Maps a frontend 5-tab filter status (PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED)
     * to the underlying database OrderStatus enum values.
     * Returns empty list when filter is null/blank/ALL (meaning no status filter).
     * Throws IllegalArgumentException if filter is unknown.
     */
    public static List<OrderStatus> mapFilterToDbStatuses(String filterStatus) {
        if (filterStatus == null || filterStatus.isBlank() || "ALL".equalsIgnoreCase(filterStatus.trim())) {
            return List.of();
        }
        return switch (filterStatus.trim().toUpperCase()) {
            case "PENDING" -> List.of(OrderStatus.PENDING);
            case "CONFIRMED" -> List.of(OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.PACKED);
            case "SHIPPING" -> List.of(OrderStatus.SHIPPING);
            case "COMPLETED" -> List.of(OrderStatus.DELIVERED);
            case "CANCELLED" -> List.of(OrderStatus.CANCELLED, OrderStatus.REJECTED);
            default -> throw new IllegalArgumentException("Invalid order status filter: " + filterStatus);
        };
    }

    /**
     * Maps a database OrderStatus to the 5-value frontend status string.
     */
    public static String mapDbStatusToUiStatus(OrderStatus dbStatus) {
        if (dbStatus == null) {
            return "PENDING";
        }
        return switch (dbStatus) {
            case PENDING -> "PENDING";
            case CONFIRMED, PREPARING, PACKED -> "CONFIRMED";
            case SHIPPING -> "SHIPPING";
            case DELIVERED -> "COMPLETED";
            case CANCELLED, REJECTED -> "CANCELLED";
        };
    }

    /**
     * Joins 4 address parts into addressDetail as "streetAddress, ward, district, province".
     */
    public static String formatAddressDetail(String streetAddress, String ward, String district, String province) {
        return String.format("%s, %s, %s, %s",
                safeTrim(streetAddress),
                safeTrim(ward),
                safeTrim(district),
                safeTrim(province));
    }

    /**
     * Splits addressDetail ("streetAddress, ward, district, province") from the right
     * so streetAddress may safely contain commas. Always returns a 4-element array.
     */
    public static String[] parseAddressDetail(String addressDetail) {
        if (addressDetail == null || addressDetail.isBlank()) {
            return new String[]{"", "", "", ""};
        }
        String rest = addressDetail.trim();
        String[] result = new String[]{"", "", "", ""};
        for (int i = 3; i >= 1; i--) {
            int lastComma = rest.lastIndexOf(',');
            if (lastComma < 0) {
                result[0] = rest.trim();
                return result;
            }
            result[i] = rest.substring(lastComma + 1).trim();
            rest = rest.substring(0, lastComma).trim();
        }
        result[0] = rest;
        return result;
    }

    private static String safeTrim(String s) {
        return s == null ? "" : s.trim();
    }
}
