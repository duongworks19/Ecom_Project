package com.vic.ecom.repository;

import com.vic.ecom.entity.Order;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public interface ReportRepository extends Repository<Order, Long> {
    @Query(value="select coalesce(sum(o.total),0) from orders o where o.status='DELIVERED' and o.delivered_at >= :from and o.delivered_at < :to and (:shopId is null or o.shop_id=:shopId)", nativeQuery=true)
    BigDecimal revenue(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select count(*) from orders o where o.create_at >= :from and o.create_at < :to and (:shopId is null or o.shop_id=:shopId)", nativeQuery=true)
    Long orders(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select count(*) from orders o where o.status='DELIVERED' and o.delivered_at >= :from and o.delivered_at < :to and (:shopId is null or o.shop_id=:shopId)", nativeQuery=true)
    Long delivered(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select count(*) from orders o where o.status in ('CANCELLED','REJECTED') and o.create_at >= :from and o.create_at < :to and (:shopId is null or o.shop_id=:shopId)", nativeQuery=true)
    Long cancelled(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select cast(o.create_at as date), coalesce(sum(case when o.status='DELIVERED' then o.total else 0 end),0) from orders o where o.create_at >= :from and o.create_at < :to and (:shopId is null or o.shop_id=:shopId) group by cast(o.create_at as date) order by cast(o.create_at as date)", nativeQuery=true)
    List<Object[]> revenueByDay(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select p.name, sum(oi.quantity) from order_items oi join orders o on o.id=oi.order_id join product_variants v on v.id=oi.variant_id join products p on p.id=v.product_id where o.status='DELIVERED' and o.delivered_at >= :from and o.delivered_at < :to and (:shopId is null or o.shop_id=:shopId) group by p.id,p.name order by sum(oi.quantity) desc limit 5", nativeQuery=true)
    List<Object[]> topProducts(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select s.name, sum(o.total) from orders o join shops s on s.id=o.shop_id where o.status='DELIVERED' and o.delivered_at >= :from and o.delivered_at < :to and (:shopId is null or o.shop_id=:shopId) group by s.id,s.name order by sum(o.total) desc limit 5", nativeQuery=true)
    List<Object[]> topVendors(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to, @Param("shopId") Long shopId);
    @Query(value="select cast(o.create_at as date),o.order_code,o.status,o.total,o.shop_id from orders o where o.create_at >= :from and o.create_at < :to order by o.create_at limit 50000", nativeQuery=true)
    List<Object[]> orderExport(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    @Query(value="select cast(o.delivered_at as date),p.name,v.sku,coalesce(sum(oi.quantity),0),coalesce(sum(oi.quantity*oi.unit_price),0) from order_items oi join orders o on o.id=oi.order_id join product_variants v on v.id=oi.variant_id join products p on p.id=v.product_id where o.status='DELIVERED' and o.delivered_at >= :from and o.delivered_at < :to group by cast(o.delivered_at as date),p.name,v.sku order by sum(oi.quantity) desc limit 50000", nativeQuery=true)
    List<Object[]> productExport(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    @Query(value="select cast(s.assigned_at as date),o.order_code,s.cod_amount,s.cod_collected,s.status from shipments s join orders o on o.id=s.order_id where s.assigned_at >= :from and s.assigned_at < :to order by s.assigned_at limit 50000", nativeQuery=true)
    List<Object[]> codExport(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    @Query(value="select cast(vu.used_at as date),v.code,vu.order_id,vu.discount_amount from voucher_usages vu join vouchers v on v.id=vu.voucher_id where vu.used_at >= :from and vu.used_at < :to order by vu.used_at limit 50000", nativeQuery=true)
    List<Object[]> voucherExport(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
    @Query(value="select cast(rr.created_at as date),rr.order_id,rr.refund_amount,rr.status from return_requests rr where rr.created_at >= :from and rr.created_at < :to and rr.type='REFUND' and rr.status='APPROVED' order by rr.created_at limit 50000", nativeQuery=true)
    List<Object[]> refundExport(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
