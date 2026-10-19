import {
  getOrderStatusPresentation,
  isValidOrderStatusFilter,
  ORDER_STATUS_TABS,
} from './order-status.map';

describe('order-status.map', () => {
  it('maps each OrderStatus to exact Vietnamese label and dot color', () => {
    expect(getOrderStatusPresentation('PENDING')).toEqual({
      status: 'PENDING',
      label: 'Chờ xác nhận',
      dotColor: '#91918c',
    });
    expect(getOrderStatusPresentation('CONFIRMED')).toEqual({
      status: 'CONFIRMED',
      label: 'Chờ lấy hàng',
      dotColor: '#7e238b',
    });
    expect(getOrderStatusPresentation('SHIPPING')).toEqual({
      status: 'SHIPPING',
      label: 'Đang vận chuyển',
      dotColor: '#435ee5',
    });
    expect(getOrderStatusPresentation('COMPLETED')).toEqual({
      status: 'COMPLETED',
      label: 'Giao hàng thành công',
      dotColor: '#103c25',
    });
    expect(getOrderStatusPresentation('CANCELLED')).toEqual({
      status: 'CANCELLED',
      label: 'Đã hủy',
      dotColor: '#9e0a0a',
    });
  });

  it('defines 6 status filter tabs and validates filter keys', () => {
    expect(ORDER_STATUS_TABS.length).toBe(6);
    expect(isValidOrderStatusFilter('ALL')).toBe(true);
    expect(isValidOrderStatusFilter('SHIPPING')).toBe(true);
    expect(isValidOrderStatusFilter('UNKNOWN')).toBe(false);
  });
});
