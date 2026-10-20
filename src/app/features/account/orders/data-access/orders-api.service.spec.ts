import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { OrdersApiService } from './orders-api.service';
import { CustomerOrderPageResponse } from './orders.models';

describe('OrdersApiService', () => {
  let service: OrdersApiService;
  let httpMock: HttpTestingController;

  const samplePage: CustomerOrderPageResponse = {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(OrdersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('passes status, q, page, size query params only when defined', async () => {
    const p1 = firstValueFrom(service.listOrders({ page: 0, size: 10 }));
    const req1 = httpMock.expectOne(
      (r) =>
        r.url === '/api/customer/orders' &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '10' &&
        !r.params.has('status') &&
        !r.params.has('q')
    );
    req1.flush(samplePage);
    await p1;

    const p2 = firstValueFrom(
      service.listOrders({ status: 'SHIPPING', q: '  VIC-240918 ', page: 1, size: 10 })
    );
    const req2 = httpMock.expectOne(
      (r) =>
        r.url === '/api/customer/orders' &&
        r.params.get('status') === 'SHIPPING' &&
        r.params.get('q') === 'VIC-240918' &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10'
    );
    req2.flush(samplePage);
    await p2;
  });

  it('calls POST cancel and POST rebuy endpoints', async () => {
    const cancelPromise = firstValueFrom(
      service.cancelOrder(101, { reason: 'Đổi địa chỉ nhận hàng' })
    );
    const cancelReq = httpMock.expectOne('/api/customer/orders/101/cancel');
    expect(cancelReq.request.method).toBe('POST');
    expect(cancelReq.request.body).toEqual({ reason: 'Đổi địa chỉ nhận hàng' });
    cancelReq.flush({ id: 101, status: 'CANCELLED' });
    await cancelPromise;

    const rebuyPromise = firstValueFrom(service.rebuyOrder(101));
    const rebuyReq = httpMock.expectOne('/api/customer/orders/101/rebuy');
    expect(rebuyReq.request.method).toBe('POST');
    rebuyReq.flush({ addedItemCount: 2 });
    const rebuyRes = await rebuyPromise;
    expect(rebuyRes.addedItemCount).toBe(2);
  });
});
