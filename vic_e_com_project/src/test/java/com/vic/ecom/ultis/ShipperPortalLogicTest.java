package com.vic.ecom.ultis;

import org.junit.jupiter.api.Test;
import java.time.*;
import static org.assertj.core.api.Assertions.assertThat;

class ShipperPortalLogicTest {
    @Test void successRateIsNullWhenThereAreNoCompletedShipments() {
        assertThat(rate(0, 0)).isNull();
    }

    @Test void successRateUsesDeliveredOverDeliveredAndFailed() {
        assertThat(rate(3, 1)).isEqualTo(75.0);
    }

    @Test void todayUsesVietnameseMidnightBoundary() {
        ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        LocalDateTime from = LocalDate.of(2026, 10, 23).atStartOfDay();
        LocalDateTime to = from.plusDays(1);
        assertThat(ZonedDateTime.of(from, zone).toInstant()).isBefore(ZonedDateTime.of(to, zone).toInstant());
        assertThat(LocalDateTime.of(2026, 10, 23, 0, 0)).isEqualTo(from);
    }

    private static Double rate(long delivered, long failed) {
        return delivered + failed == 0 ? null : (double) delivered / (delivered + failed) * 100;
    }
}
