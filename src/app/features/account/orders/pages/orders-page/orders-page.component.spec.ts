import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { OrdersPageComponent } from './orders-page.component';
import { CustomerOrderPageResponse } from '../../data-access/orders.models';

describe('OrdersPageComponent', () => {
  let fixture: ComponentFixture<OrdersPageComponent>;
  let component: OrdersPageComponent;
  let httpMock: HttpTestingController;

  const samplePageResponse: CustomerOrderPageResponse = {
    content: [
      {
        id: 101,
        orderCode: 'VIC-240918',
        shopId: 10,
        shopName: 'VIC Studio Official',
        status: 'SHIPPING',
        createdAt: '2026-04-12T10:00:00Z',
        totalAmount: 640000,
        canCancel: false,
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
      },
    ],
    page: 0,
    size: 10,
    totalElements: 1,
    totalPages: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrdersPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrdersPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches orders on init and renders order card', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne(
      (r) => r.url === '/api/customer/orders' && r.params.get('page') === '0'
    );
    req.flush(samplePageResponse);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('VIC Studio Official');
    expect(fixture.nativeElement.textContent).toContain('VIC-240918');
    expect(fixture.nativeElement.textContent).toContain('Đang vận chuyển');
  });

  it('shows empty state when no orders are returned', () => {
    fixture.detectChanges();
    httpMock
      .expectOne((r) => r.url === '/api/customer/orders')
      .flush({
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'Chưa có đơn hàng nào ở trạng thái này.'
    );
  });

  it('cancels order and refreshes list when confirmCancelOrder is called', () => {
    fixture.detectChanges();
    httpMock.expectOne((r) => r.url === '/api/customer/orders').flush(samplePageResponse);
    fixture.detectChanges();

    component.promptCancelOrder({
      ...samplePageResponse.content[0],
      status: 'PENDING',
      canCancel: true,
    });
    component.confirmCancelOrder('Muốn thay đổi địa chỉ nhận');

    const cancelReq = httpMock.expectOne('/api/customer/orders/101/cancel');
    expect(cancelReq.request.method).toBe('POST');
    cancelReq.flush({ ...samplePageResponse.content[0], status: 'CANCELLED' });

    const reloadReq = httpMock.expectOne((r) => r.url === '/api/customer/orders');
    reloadReq.flush(samplePageResponse);
  });
});
