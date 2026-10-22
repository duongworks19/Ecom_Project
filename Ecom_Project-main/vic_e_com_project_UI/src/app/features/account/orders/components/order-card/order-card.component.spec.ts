import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderCardComponent } from './order-card.component';
import { CustomerOrder } from '../../data-access/orders.models';

describe('OrderCardComponent', () => {
  const baseOrder: CustomerOrder = {
    id: 100,
    orderCode: 'VIC-240918',
    shopId: 10,
    shopName: 'VIC Studio Official',
    status: 'PENDING',
    createdAt: '2026-04-10T08:00:00Z',
    totalAmount: 640000,
    canCancel: true,
    items: [
      {
        productId: 501,
        productName: 'Áo khoác linen cổ đứng form rộng',
        variantLabel: 'Be sáng, Size M',
        thumbnailUrl: null,
        quantity: 1,
        unitPrice: 640000,
        lineTotal: 640000,
      },
    ],
  };

  it('shows Xem chi tiết and Hủy đơn when status is PENDING and canCancel is true', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderCardComponent);
    fixture.componentRef.setInput('order', baseOrder);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Xem chi tiết');
    expect(text).toContain('Hủy đơn');
    expect(text).not.toContain('Mua lại');
  });

  it('shows Xem chi tiết and Mua lại when status is COMPLETED', async () => {
    await TestBed.configureTestingModule({
      imports: [OrderCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(OrderCardComponent);
    fixture.componentRef.setInput('order', {
      ...baseOrder,
      status: 'COMPLETED',
      canCancel: false,
    });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Giao hàng thành công');
    expect(text).toContain('Xem chi tiết');
    expect(text).toContain('Mua lại');
    expect(text).not.toContain('Hủy đơn');
  });
});
