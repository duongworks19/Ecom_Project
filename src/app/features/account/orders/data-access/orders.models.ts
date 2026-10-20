export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'SHIPPING'
  | 'COMPLETED'
  | 'CANCELLED';

export type OrderStatusFilter = 'ALL' | OrderStatus;

export interface CustomerOrderItem {
  productId: number;
  productName: string;
  variantLabel: string | null;
  thumbnailUrl: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface CustomerOrder {
  id: number;
  orderCode: string;
  shopId: number;
  shopName: string;
  status: OrderStatus;
  createdAt: string;
  totalAmount: number;
  canCancel: boolean;
  items: CustomerOrderItem[];
}

export interface OrderStatusCounts {
  ALL?: number;
  PENDING?: number;
  CONFIRMED?: number;
  SHIPPING?: number;
  COMPLETED?: number;
  CANCELLED?: number;
}

export interface CustomerOrderPageResponse {
  content: CustomerOrder[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  countsByStatus?: OrderStatusCounts;
}

export interface CustomerOrderListQuery {
  status?: OrderStatus;
  q?: string;
  page: number;
  size: number;
}

export interface CancelCustomerOrderRequest {
  reason: string;
}

export interface RebuyCustomerOrderResponse {
  addedItemCount: number;
}
