import { OrderStatus, OrderStatusFilter } from '../data-access/orders.models';

export interface OrderStatusPresentation {
  status: OrderStatus;
  label: string;
  dotColor: string;
}

export interface OrderTabDefinition {
  key: OrderStatusFilter;
  label: string;
}

export const ORDER_STATUS_TABS: readonly OrderTabDefinition[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PENDING', label: 'Chờ xác nhận' },
  { key: 'CONFIRMED', label: 'Chờ lấy hàng' },
  { key: 'SHIPPING', label: 'Đang giao' },
  { key: 'COMPLETED', label: 'Hoàn thành' },
  { key: 'CANCELLED', label: 'Đã hủy' },
] as const;

export const ORDER_STATUS_PRESENTATION_MAP: Readonly<Record<OrderStatus, OrderStatusPresentation>> = {
  PENDING: {
    status: 'PENDING',
    label: 'Chờ xác nhận',
    dotColor: '#91918c',
  },
  CONFIRMED: {
    status: 'CONFIRMED',
    label: 'Chờ lấy hàng',
    dotColor: '#7e238b',
  },
  SHIPPING: {
    status: 'SHIPPING',
    label: 'Đang vận chuyển',
    dotColor: '#435ee5',
  },
  COMPLETED: {
    status: 'COMPLETED',
    label: 'Giao hàng thành công',
    dotColor: '#103c25',
  },
  CANCELLED: {
    status: 'CANCELLED',
    label: 'Đã hủy',
    dotColor: '#9e0a0a',
  },
};

export function getOrderStatusPresentation(status: OrderStatus): OrderStatusPresentation {
  return (
    ORDER_STATUS_PRESENTATION_MAP[status] ?? {
      status,
      label: status,
      dotColor: '#91918c',
    }
  );
}

export function isValidOrderStatusFilter(value: string | null | undefined): value is OrderStatusFilter {
  if (!value) {
    return false;
  }
  return ORDER_STATUS_TABS.some((tab) => tab.key === value);
}
