import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { OrderDetailPlaceholderPageComponent } from './order-detail-placeholder-page.component';

describe('OrderDetailPlaceholderPageComponent', () => {
  let fixture: ComponentFixture<OrderDetailPlaceholderPageComponent>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailPlaceholderPageComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '101' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailPlaceholderPageComponent);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads order detail by id from GET /api/customer/orders/:id', () => {
    fixture.detectChanges();
    const req = httpMock.expectOne('/api/customer/orders/101');
    req.flush({
      id: 101,
      orderCode: 'VIC-240918',
      shopId: 10,
      shopName: 'VIC Studio Official',
      status: 'COMPLETED',
      createdAt: '2026-04-12T10:00:00Z',
      totalAmount: 640000,
      canCancel: false,
      items: [],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('VIC-240918');
  });
});
