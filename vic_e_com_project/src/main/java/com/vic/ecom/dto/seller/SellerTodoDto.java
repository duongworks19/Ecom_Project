package com.vic.ecom.dto.seller;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SellerTodoDto {
    private int pendingConfirmationOrders; // 5 - Đơn chờ xác nhận
    private int pendingPackagingOrders;     // 7 - Chờ đóng gói
    private int refundRequests;             // 2 - Yêu cầu hoàn tiền
    private int lowStockAlerts;             // 4 - Sắp hết hàng
    private int unansweredQuestions;       // 3 - Câu hỏi chưa trả lời
}
