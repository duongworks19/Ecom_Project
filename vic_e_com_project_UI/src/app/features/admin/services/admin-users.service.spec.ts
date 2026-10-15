import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AdminUsersService } from './admin-users.service';
import { environment } from '../../../../environments/environment';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let httpMock: HttpTestingController;
  const baseUrl = `${environment.apiUrl}/admin/customers`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AdminUsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('fetches customer overview (summary + paginated list) and toggles status via backend API', async () => {
    const overviewPromise = firstValueFrom(service.getCustomersOverview('khanhlinh', 'LOCKED', 0, 10));

    const summaryReq = httpMock.expectOne(`${baseUrl}/summary`);
    expect(summaryReq.request.method).toBe('GET');
    summaryReq.flush({ total: 96, active: 91, locked: 5, newLast7Days: 3 });

    const listReq = httpMock.expectOne(
      (req) =>
        req.url === baseUrl &&
        req.params.get('keyword') === 'khanhlinh' &&
        req.params.get('status') === 'LOCKED' &&
        req.params.get('page') === '0'
    );
    expect(listReq.request.method).toBe('GET');
    listReq.flush({
      items: [
        {
          id: 6,
          fullName: 'Đỗ Khánh Linh',
          email: 'khanhlinh.do@gmail.com',
          phone: '0912345678',
          avatarUrl: null,
          status: 'LOCKED',
          createdAt: '2026-09-02T10:00:00',
        },
      ],
      page: 0,
      size: 10,
      totalElements: 1,
      totalPages: 1,
    });

    const overview = await overviewPromise;
    expect(overview.kpis[0].value).toBe(96);
    expect(overview.customers.length).toBe(1);
    expect(overview.customers[0].id).toBe(6);
    expect(overview.customers[0].code).toBe('CUS-006');

    const unlockPromise = firstValueFrom(
      service.changeCustomerStatus({
        customerId: 6,
        action: 'UNLOCK',
        reason: 'Đã xác minh tài khoản',
      })
    );

    const unlockReq = httpMock.expectOne(`${baseUrl}/6/unlock`);
    expect(unlockReq.request.method).toBe('POST');
    expect(unlockReq.request.body).toEqual({ reason: 'Đã xác minh tài khoản' });
    unlockReq.flush({ id: 6, status: 'ACTIVE' });

    const unlockRes = await unlockPromise;
    expect(unlockRes.status).toBe('ACTIVE');
  });
});

