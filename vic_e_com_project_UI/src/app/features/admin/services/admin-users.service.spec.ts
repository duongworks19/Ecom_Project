import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminUsersService);
  });

  it('filters customers by keyword and toggles status with reason', async () => {
    const searchRes = await firstValueFrom(service.getCustomersOverview('khanhlinh', 'LOCKED'));
    expect(searchRes.customers.length).toBe(1);
    expect(searchRes.customers[0].id).toBe(6);

    await firstValueFrom(
      service.changeCustomerStatus({ customerId: 6, action: 'UNLOCK', reason: 'Đã xác minh tài khoản' })
    );

    const afterUnlock = await firstValueFrom(service.getCustomersOverview('khanhlinh', 'ACTIVE'));
    expect(afterUnlock.customers.length).toBe(1);
    expect(afterUnlock.customers[0].status).toBe('ACTIVE');
  });
});
