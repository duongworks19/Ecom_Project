package com.vic.ecom.services;

import com.vic.ecom.entity.OrderItem;
import com.vic.ecom.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service @RequiredArgsConstructor
public class OrderStockReleaseService {
    private final OrderItemRepository items;
    private final ProductVariantRepository variants;
    private final VoucherRepository vouchers;
    private final VoucherUsageRepository usages;

    @Transactional
    public void releaseOrderStock(com.vic.ecom.entity.Order order) {
        for (OrderItem item : items.findByOrder_IdOrderByIdAsc(order.getId())) {
            if (item.getVariantId() == null) continue;
            variants.findById(item.getVariantId()).ifPresent(v -> {
                int quantity = item.getQuantity() == null ? 0 : item.getQuantity();
                v.setStockQty((v.getStockQty() == null ? 0 : v.getStockQty()) + quantity);
                variants.save(v);
            });
        }
        if (order.getVoucherId() != null) vouchers.releaseUsage(order.getVoucherId());
        // ponytail: campaign sold_count is intentionally not restored because order_items has no campaign_product_id.
        usages.deleteByOrderId(order.getId());
    }
}
