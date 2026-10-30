export interface AdminOrderSummary {
  total: number;
  delivering: number;
  needsAttention: number;
  delivered: number;
  byStatus: Record<string, number>;
}

export interface AdminOrderPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface AdminOrderItem {
  id: number;
  orderCode: string;
  createdAt: string;
  customerName: string;
  recipientName: string;
  shopName: string;
  total: number;
  paymentMethod: string;
  statusKey: string;
  statusLabel: string;
  needsAttention: boolean;
}

export interface AdminOrderCustomer {
  accountName: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
}

export interface AdminOrderShop {
  name: string;
  businessName: string;
}

export interface AdminOrderLineItem {
  productName: string;
  variantInfo: string;
  unitPrice: number;
  quantity: number;
}

export interface AdminOrderAmounts {
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  voucherCode: string | null;
}

export interface AdminOrderPayment {
  method: string;
  amount: number;
  status: string;
  paidAt: string | null;
  collectedBy: string | null;
}

export interface AdminOrderShipmentEvent {
  status: string;
  note: string | null;
  at: string | null;
}

export interface AdminOrderShipmentFailure {
  attemptNo: number;
  reason: string | null;
  nextAction: string | null;
  at: string | null;
}

export interface AdminOrderShipment {
  id: number;
  shipperName: string | null;
  status: string;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  codAmount: number;
  codCollected: boolean;
  events: AdminOrderShipmentEvent[];
  failures: AdminOrderShipmentFailure[];
}

export interface AdminOrderReturnRequest {
  type: string;
  reason: string | null;
  status: string;
  vendorResponse: string | null;
  refundAmount: number;
  createdAt: string | null;
  mediaUrls: string[];
}

export interface AdminOrderSupportTicket {
  type: string;
  subject: string;
  status: string;
  createdAt: string | null;
}

export interface AdminOrderTimeline {
  fromStatus: string | null;
  toStatus: string;
  fromLabel: string | null;
  toLabel: string;
  changedBy: string | null;
  role: string | null;
  note: string | null;
  at: string | null;
}

export interface AdminOrderDetail {
  id: number;
  customer: AdminOrderCustomer;
  shop: AdminOrderShop;
  items: AdminOrderLineItem[];
  amounts: AdminOrderAmounts;
  payments: AdminOrderPayment[];
  shipping: AdminOrderShipment[];
  returnRequests: AdminOrderReturnRequest[];
  supportTickets: AdminOrderSupportTicket[];
  cancelReason: string | null;
  rejectReason: string | null;
  timeline: AdminOrderTimeline[];
}

export interface ShopOption {
  id: number;
  name: string;
}

export interface AdminOrderFilter {
  q?: string;
  status?: string;
  shopId?: number;
  paymentMethod?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export const ADMIN_ORDER_STATUS_CHIPS = [
  { key: 'waiting_confirm', label: 'Chờ xác nhận' },
  { key: 'preparing', label: 'Đang chuẩn bị' },
  { key: 'delivering', label: 'Đang giao' },
  { key: 'delivered', label: 'Đã giao' },
  { key: 'delivery_failed', label: 'Giao thất bại' },
  { key: 'cancelled', label: 'Đã hủy' },
  { key: 'return_refund', label: 'Đổi trả' },
] as const;

