package com.vic.ecom.services;

import java.time.LocalDate;
import java.time.ZoneId;

public record ReportPeriod(LocalDate from, LocalDate to) {
    public static ReportPeriod of(String period, LocalDate from, LocalDate to, ZoneId zone) {
        LocalDate today = LocalDate.now(zone);
        if ("today".equalsIgnoreCase(period)) return new ReportPeriod(today, today.plusDays(1));
        if ("30days".equalsIgnoreCase(period)) return new ReportPeriod(today.minusDays(29), today.plusDays(1));
        if ("month".equalsIgnoreCase(period) || "thisMonth".equalsIgnoreCase(period))
            return new ReportPeriod(today.withDayOfMonth(1), today.plusDays(1));
        if ("custom".equalsIgnoreCase(period)) {
            if (from == null || to == null || !from.isBefore(to)) throw new IllegalArgumentException("Khoảng thời gian không hợp lệ");
            if (from.plusDays(366).isBefore(to)) throw new IllegalArgumentException("Khoảng thời gian tối đa 366 ngày");
            return new ReportPeriod(from, to);
        }
        return new ReportPeriod(today.minusDays(6), today.plusDays(1));
    }
    public ReportPeriod previous() { long days = from.until(to).getDays(); return new ReportPeriod(from.minusDays(days), from); }
}
