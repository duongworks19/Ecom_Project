package com.vic.ecom.services;

import com.vic.ecom.dto.ReportsDtos;
import com.vic.ecom.entity.Category;
import com.vic.ecom.repository.CategoryRepository;
import com.vic.ecom.repository.ReportRepository;
import com.vic.ecom.repository.ShopRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import java.math.*;
import java.time.*;
import java.util.*;

@Service
public class AdminReportService {
    private final ReportRepository reports; private final ShopRepository shops; private final CategoryRepository categories;
    private final ZoneId zone;
    public AdminReportService(ReportRepository reports, ShopRepository shops, CategoryRepository categories,
                               @Value("${reports.zone:Asia/Ho_Chi_Minh}") String zone) {
        this.reports=reports; this.shops=shops; this.categories=categories; this.zone=ZoneId.of(zone);
    }
    public ReportsDtos.Filters filters() {
        var vendors=shops.findAll().stream().sorted(Comparator.comparing(s->s.getName(), String.CASE_INSENSITIVE_ORDER))
                .map(s->new ReportsDtos.FilterItem(s.getId(),s.getName())).toList();
        var cats=categories.findAllByOrderByIdAsc().stream().map(c->new ReportsDtos.FilterItem(c.getId(),c.getName())).toList();
        return new ReportsDtos.Filters(vendors,cats);
    }
    public ReportsDtos.Overview overview(String period, LocalDate from, LocalDate to, Long shopId) {
        ReportPeriod p=ReportPeriod.of(period,from,to,zone); ReportPeriod prev=p.previous();
        LocalDateTime f=p.from().atStartOfDay(zone).toLocalDateTime(), t=p.to().atStartOfDay(zone).toLocalDateTime();
        LocalDateTime pf=prev.from().atStartOfDay(zone).toLocalDateTime(), pt=prev.to().atStartOfDay(zone).toLocalDateTime();
        BigDecimal rev=n(reports.revenue(f,t,shopId)), prevRev=n(reports.revenue(pf,pt,shopId));
        long orders=n(reports.orders(f,t,shopId)).longValue(), delivered=n(reports.delivered(f,t,shopId)).longValue();
        long cancelled=n(reports.cancelled(f,t,shopId)).longValue();
        var kpis=List.of(kpi("revenue","Doanh thu",rev,rev,prevRev,"VNĐ"), kpi("orders","Số đơn hàng",BigDecimal.valueOf(orders),BigDecimal.valueOf(orders),n(reports.orders(pf,pt,shopId)),"đơn"), kpi("aov","Giá trị đơn trung bình",delivered==0?BigDecimal.ZERO:rev.divide(BigDecimal.valueOf(delivered),2,RoundingMode.HALF_UP),BigDecimal.ZERO,BigDecimal.ZERO,"đơn đã giao"), kpi("cancel-rate","Tỷ lệ hủy đơn",orders==0?BigDecimal.ZERO:BigDecimal.valueOf(cancelled*100.0/orders),BigDecimal.ZERO,BigDecimal.ZERO,"đơn"));
        Map<LocalDate,BigDecimal> daily=new HashMap<>(); reports.revenueByDay(f,t,shopId).forEach(r->daily.put(((java.sql.Date)r[0]).toLocalDate(),n((Number)r[1])));
        List<ReportsDtos.Trend> trend=new ArrayList<>(); for(LocalDate d=p.from();d.isBefore(p.to());d=d.plusDays(1)) trend.add(new ReportsDtos.Trend(d,daily.getOrDefault(d,BigDecimal.ZERO),BigDecimal.ZERO));
        var products=reports.topProducts(f,t,shopId).stream().map(new java.util.function.Function<Object[],ReportsDtos.ProductRow>(){int i=0; public ReportsDtos.ProductRow apply(Object[] r){return new ReportsDtos.ProductRow(++i,(String)r[0],((Number)r[1]).longValue(),BigDecimal.ZERO);}}).toList();
        var vendors=reports.topVendors(f,t,shopId).stream().map(new java.util.function.Function<Object[],ReportsDtos.VendorRow>(){int i=0; public ReportsDtos.VendorRow apply(Object[] r){return new ReportsDtos.VendorRow(++i,(String)r[0],n((Number)r[1]),BigDecimal.ZERO);}}).toList();
        return new ReportsDtos.Overview(period,p.from(),p.to().minusDays(1),kpis,trend,products,vendors);
    }
    public byte[] export(String type, String period) {
        ReportPeriod p=ReportPeriod.of(period,null,null,zone); LocalDateTime f=p.from().atStartOfDay(), t=p.to().atStartOfDay();
        List<Object[]> rows; String header;
        switch(type){
            case "orders" -> { header="date,order_code,status,total,shop_id"; rows=reports.orderExport(f,t); }
            case "products" -> { header="date,product,sku,quantity,revenue"; rows=reports.productExport(f,t); }
            case "cod" -> { header="type,date,order_code,amount,status"; rows=new ArrayList<>(reports.codExport(f,t)); rows.addAll(reports.refundExport(f,t)); }
            case "vouchers" -> { header="date,voucher_code,order_id,discount_amount"; rows=reports.voucherExport(f,t); }
            default -> { header="date,revenue"; rows=reports.revenueByDay(f,t,null); }
        }
        StringBuilder csv=new StringBuilder("\uFEFF").append(header).append('\n');
        for(Object[] row:rows){if("cod".equals(type)) csv.append(row.length==5?"COD,":"REFUND,"); for(int i=0;i<row.length;i++){if(i>0)csv.append(','); csv.append(csvValue(row[i]));}csv.append('\n');}
        return csv.toString().getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }
    private String csvValue(Object value){if(value==null)return ""; String s=String.valueOf(value).replace("\"","\"\""); return s.matches(".*[,\"\\r\\n].*")?"\""+s+"\"":s;}
    private ReportsDtos.Kpi kpi(String id,String title,BigDecimal value,BigDecimal current,BigDecimal previous,String note){return new ReportsDtos.Kpi(id,title,value,change(current,previous),note);}
    private BigDecimal change(BigDecimal a,BigDecimal b){return b.signum()==0?null:a.subtract(b).multiply(BigDecimal.valueOf(100)).divide(b,1,RoundingMode.HALF_UP);}
    private BigDecimal n(Number n){return n==null?BigDecimal.ZERO:n instanceof BigDecimal?(BigDecimal)n:BigDecimal.valueOf(n.doubleValue());}
}
