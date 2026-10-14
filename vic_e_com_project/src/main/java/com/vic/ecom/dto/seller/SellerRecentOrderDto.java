package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerRecentOrderDto {
    private Long id;
    private String orderCode;       // e.g. "#VM240918"
    private String customerName;    // e.g. "Nguyễn Thu Hà"
    private String customerPhone;
    private String shippingAddress;
    private String createdAt;
    private String productSummary;  // e.g. "Đèn ngủ gốm Cloud ×1"
    private String productImage;    // Product thumbnail URL
    private BigDecimal totalAmount; // e.g. 420000
    private String status;          // "PENDING_CONFIRMATION", "PREPARING", "REFUND_REQUEST", "PACKED", "IN_REVIEW", "COMPLETED"
    private String statusLabel;     // "Chờ xác nhận", "Đang chuẩn bị", "Hoàn tiền", "Đã đóng gói"
    private String badgeClass;      // "w" (warning), "o" (ok), "r" (danger)
    private String actionText;      // "Xác nhận", "Đã đóng gói", "Xem xét"
    private String actionStyle;     // "red", "outline"
    private String nextAction;      // "CONFIRM", "MARK_PACKED", "REVIEW_REFUND", "APPROVE_REFUND", "VIEW_DETAIL"

    public SellerRecentOrderDto(
            Long id,
            String orderCode,
            String customerName,
            String productSummary,
            String productImage,
            BigDecimal totalAmount,
            String status,
            String statusLabel,
            String badgeClass,
            String actionText,
            String actionStyle,
            String nextAction
    ) {
        this.id = id;
        this.orderCode = orderCode;
        this.customerName = customerName;
        this.productSummary = productSummary;
        this.productImage = productImage;
        this.totalAmount = totalAmount;
        this.status = status;
        this.statusLabel = statusLabel;
        this.badgeClass = badgeClass;
        this.actionText = actionText;
        this.actionStyle = actionStyle;
        this.nextAction = nextAction;
    }
}
