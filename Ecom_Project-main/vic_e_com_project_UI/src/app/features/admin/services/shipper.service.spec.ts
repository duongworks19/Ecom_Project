import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MockShipperService } from './shipper.service';

describe('MockShipperService', () => {
  let service: MockShipperService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MockShipperService],
    });
    service = TestBed.inject(MockShipperService);
  });

  it('returns summary matching initial 8 shippers and 9 active deliveries', async () => {
    const summary = await firstValueFrom(service.getSummary());
    expect(summary.total).toBe(8);
    expect(summary.available).toBe(3);
    expect(summary.busy).toBe(3);
    expect(summary.deliveringOrders).toBe(9);
    expect(summary.locked).toBe(1);
  });

  it('filters shippers by keyword and status', async () => {
    const busyRes = await firstValueFrom(service.getShippers({ status: 'BUSY' }));
    expect(busyRes.total).toBe(3);

    const searchRes = await firstValueFrom(service.getShippers({ keyword: 'Thanh Tùng' }));
    expect(searchRes.items.length).toBe(1);
    expect(searchRes.items[0].fullName).toContain('Vũ Thanh Tùng');
  });

  it('creates a new shipper and rejects duplicate email/phone with 409', async () => {
    const created = await firstValueFrom(
      service.createShipper({
        fullName: 'Đặng Quốc Bảo',
        phone: '0909888777',
        email: 'quocbao.shipper@vicmart.vn',
        vehicleType: 'Xe máy',
        licensePlate: '59-Z1 999.99',
        serviceArea: 'Quận 10, TP.HCM',
        sendTempPasswordByEmail: true,
      })
    );
    expect(created.fullName).toBe('Đặng Quốc Bảo');
    expect(created.workStatus).toBe('AVAILABLE');
    expect(created.accountStatus).toBe('ACTIVE');

    try {
      await firstValueFrom(
        service.createShipper({
          fullName: 'Trùng Email',
          phone: '0911000111',
          email: 'quocbao.shipper@vicmart.vn',
          vehicleType: 'Xe đạp điện',
          licensePlate: '59-A1 111.11',
          serviceArea: 'Quận 1',
          sendTempPasswordByEmail: true,
        })
      );
      expect.fail('Expected 409 conflict');
    } catch (err) {
      expect((err as HttpErrorResponse).status).toBe(409);
    }
  });

  it('prevents locking a busy shipper with active deliveries (409) and locks available shipper', async () => {
    // Vũ Thanh Tùng (id=2) has deliveringCount = 3
    try {
      await firstValueFrom(service.lockShipper(2, 'Kiểm tra khóa khi đang giao'));
      expect.fail('Expected 409 conflict when locking busy shipper');
    } catch (err) {
      expect((err as HttpErrorResponse).status).toBe(409);
    }

    // Phạm Văn Đức (id=1) has deliveringCount = 0
    const locked = await firstValueFrom(service.lockShipper(1, 'Tạm nghỉ phép'));
    expect(locked.accountStatus).toBe('LOCKED');
    expect(locked.lockReason).toBe('Tạm nghỉ phép');

    const unlocked = await firstValueFrom(service.unlockShipper(1));
    expect(unlocked.accountStatus).toBe('ACTIVE');
  });
});
