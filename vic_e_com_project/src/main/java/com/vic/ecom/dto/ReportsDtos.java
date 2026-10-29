package com.vic.ecom.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ReportsDtos {
    private ReportsDtos() {}
    public record FilterItem(Long id, String name) {}
    public record Filters(List<FilterItem> vendors, List<FilterItem> categories) {}
    public record Kpi(String id, String title, BigDecimal value, BigDecimal changePercent, String note) {}
    public record Trend(LocalDate date, BigDecimal currentAmount, BigDecimal previousAmount) {}
    public record ProductRow(int rank, String name, long soldCount, BigDecimal percentage) {}
    public record VendorRow(int rank, String shopName, BigDecimal revenue, BigDecimal sharePercent) {}
    public record Overview(String period, LocalDate from, LocalDate to, List<Kpi> kpis,
                           List<Trend> revenueTrend, List<ProductRow> topProducts,
                           List<VendorRow> topVendors) {}
}
