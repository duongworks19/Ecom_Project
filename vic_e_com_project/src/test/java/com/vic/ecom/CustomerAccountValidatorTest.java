package com.vic.ecom;

import com.vic.ecom.enums.OrderStatus;
import com.vic.ecom.ultis.CustomerAccountValidator;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class CustomerAccountValidatorTest {

    @Test
    void normalizeAndValidateVnPhone() {
        assertEquals("0912345678", CustomerAccountValidator.normalizePhone(" 0912 345 678 "));
        assertEquals("0912345678", CustomerAccountValidator.normalizePhone("+84912345678"));
        assertEquals("0912345678", CustomerAccountValidator.normalizePhone("84912345678"));
        assertEquals("0388112233", CustomerAccountValidator.normalizePhone("0388-112-233"));

        assertTrue(CustomerAccountValidator.isValidVnPhone("0912345678"));
        assertTrue(CustomerAccountValidator.isValidVnPhone("0356789012"));
        assertTrue(CustomerAccountValidator.isValidVnPhone("0587654321"));
        assertTrue(CustomerAccountValidator.isValidVnPhone("0791234567"));
        assertTrue(CustomerAccountValidator.isValidVnPhone("0812345678"));

        assertFalse(CustomerAccountValidator.isValidVnPhone("0123456789")); // invalid carrier prefix 01
        assertFalse(CustomerAccountValidator.isValidVnPhone("091234567"));  // 9 digits
        assertFalse(CustomerAccountValidator.isValidVnPhone("09123456789")); // 11 digits
        assertFalse(CustomerAccountValidator.isValidVnPhone(""));
        assertFalse(CustomerAccountValidator.isValidVnPhone(null));
    }

    @Test
    void detectImageMagicBytes() {
        byte[] jpegHeader = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        byte[] pngHeader = new byte[]{
                (byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00
        };
        byte[] gifHeader = new byte[]{0x47, 0x49, 0x46, 0x38, 0x39, 0x61};
        byte[] exeRenamedToJpg = new byte[]{0x4D, 0x5A, (byte) 0x90, 0x00};

        assertEquals("jpg", CustomerAccountValidator.detectImageExtension(jpegHeader));
        assertEquals("png", CustomerAccountValidator.detectImageExtension(pngHeader));
        assertNull(CustomerAccountValidator.detectImageExtension(gifHeader));
        assertNull(CustomerAccountValidator.detectImageExtension(exeRenamedToJpg));
        assertNull(CustomerAccountValidator.detectImageExtension(new byte[]{0x01, 0x02}));
        assertNull(CustomerAccountValidator.detectImageExtension(null));
    }

    @Test
    void mapOrderStatusFilterAndUiStatus() {
        assertTrue(CustomerAccountValidator.mapFilterToDbStatuses(null).isEmpty());
        assertTrue(CustomerAccountValidator.mapFilterToDbStatuses("").isEmpty());
        assertTrue(CustomerAccountValidator.mapFilterToDbStatuses("ALL").isEmpty());

        assertEquals(List.of(OrderStatus.PENDING),
                CustomerAccountValidator.mapFilterToDbStatuses("PENDING"));
        assertEquals(List.of(OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.PACKED),
                CustomerAccountValidator.mapFilterToDbStatuses("CONFIRMED"));
        assertEquals(List.of(OrderStatus.SHIPPING),
                CustomerAccountValidator.mapFilterToDbStatuses("SHIPPING"));
        assertEquals(List.of(OrderStatus.DELIVERED),
                CustomerAccountValidator.mapFilterToDbStatuses("COMPLETED"));
        assertEquals(List.of(OrderStatus.CANCELLED, OrderStatus.REJECTED),
                CustomerAccountValidator.mapFilterToDbStatuses("CANCELLED"));

        assertThrows(IllegalArgumentException.class,
                () -> CustomerAccountValidator.mapFilterToDbStatuses("UNKNOWN_TAB"));

        assertEquals("PENDING", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.PENDING));
        assertEquals("CONFIRMED", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.CONFIRMED));
        assertEquals("CONFIRMED", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.PREPARING));
        assertEquals("CONFIRMED", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.PACKED));
        assertEquals("SHIPPING", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.SHIPPING));
        assertEquals("COMPLETED", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.DELIVERED));
        assertEquals("CANCELLED", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.CANCELLED));
        assertEquals("CANCELLED", CustomerAccountValidator.mapDbStatusToUiStatus(OrderStatus.REJECTED));
    }

    @Test
    void formatAndParseAddressDetailPreservingStreetCommas() {
        String formatted = CustomerAccountValidator.formatAddressDetail(
                "Số 12, Ngõ 34, Đường Láng", "Phường Láng Thượng", "Quận Đống Đa", "Hà Nội");
        assertEquals("Số 12, Ngõ 34, Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội", formatted);

        String[] parsed = CustomerAccountValidator.parseAddressDetail(formatted);
        assertArrayEquals(new String[]{
                "Số 12, Ngõ 34, Đường Láng", "Phường Láng Thượng", "Quận Đống Đa", "Hà Nội"
        }, parsed);
    }
}
