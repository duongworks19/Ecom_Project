import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { RejectDialogComponent } from './reject-dialog.component';
import { VendorApprovalPage } from './vendor-approval.page';
import { VendorApplication, VendorApprovalService } from '../../services/vendor-approval.service';

const pendingVendor: VendorApplication = {
  id: 10,
  shop: 'Shop Mẫu',
  owner: 'Nguyễn An',
  email: 'an@example.vn',
  phone: '090 123 4567',
  model: 'Cá nhân',
  cat: 'Thời trang',
  pickup: 'Hà Nội',
  docs: ['CCCD mặt trước'],
  status: 'PENDING',
  at: '18/10/2026 09:00',
};

describe('VendorApprovalPage', () => {
  let fixture: ComponentFixture<VendorApprovalPage>;
  let service: {
    getVendors: ReturnType<typeof vi.fn>;
    getVendor: ReturnType<typeof vi.fn>;
    approveVendor: ReturnType<typeof vi.fn>;
    rejectVendor: ReturnType<typeof vi.fn>;
    requestAdditionalInfo: ReturnType<typeof vi.fn>;
    simulateVendorResubmission: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getVendors: vi.fn(() => of([pendingVendor])),
      getVendor: vi.fn(() => of(pendingVendor)),
      approveVendor: vi.fn((id: number) => of({ ...pendingVendor, id, status: 'APPROVED' })),
      rejectVendor: vi.fn((id: number, reason: string) => of({ ...pendingVendor, id, status: 'REJECTED', reason })),
      requestAdditionalInfo: vi.fn((id: number) => of({ ...pendingVendor, id, status: 'NEED_INFO' })),
      simulateVendorResubmission: vi.fn((id: number) => of({ ...pendingVendor, id, status: 'RESUBMITTED' })),
    };
    TestBed.configureTestingModule({
      imports: [VendorApprovalPage],
      providers: [
        { provide: VendorApprovalService, useValue: service },
      ],
    });
    fixture = TestBed.createComponent(VendorApprovalPage);
    const componentDialog = (fixture.componentInstance as unknown as { dialog: MatDialog }).dialog;
    vi.spyOn(componentDialog, 'open').mockReturnValue({
      afterClosed: () => of('Giấy tờ chưa rõ nét, vui lòng gửi lại.'),
    } as never);
    fixture.detectChanges();
  });

  it('keeps approve disabled until all four review checks are checked', () => {
    const page = fixture.componentInstance;
    expect(page.allChecked()).toBe(false);
    page.toggleCheck(0, { target: { checked: true } } as unknown as Event);
    page.toggleCheck(1, { target: { checked: true } } as unknown as Event);
    page.toggleCheck(2, { target: { checked: true } } as unknown as Event);
    expect(page.allChecked()).toBe(false);
    page.toggleCheck(3, { target: { checked: true } } as unknown as Event);
    expect(page.allChecked()).toBe(true);
  });

  it('updates list status after approval and rejects with a valid reason', () => {
    const page = fixture.componentInstance;
    page.toggleCheck(0, { target: { checked: true } } as unknown as Event);
    page.toggleCheck(1, { target: { checked: true } } as unknown as Event);
    page.toggleCheck(2, { target: { checked: true } } as unknown as Event);
    page.toggleCheck(3, { target: { checked: true } } as unknown as Event);
    page.approve();
    expect(service.approveVendor).toHaveBeenCalledTimes(1);
    expect(page.applications()[0].status).toBe('APPROVED');

    page.openRejectDialog();
    expect((page as unknown as { dialog: MatDialog }).dialog.open).toHaveBeenCalledTimes(1);
    expect(service.rejectVendor).toHaveBeenCalledTimes(1);
    expect(service.rejectVendor).toHaveBeenCalledWith(10, 'Giấy tờ chưa rõ nét, vui lòng gửi lại.');
    expect(page.applications()[0].status).toBe('REJECTED');
  });
});

describe('RejectDialogComponent', () => {
  it('blocks reasons shorter than 10 characters after trimming', () => {
    const mockRef = { close: vi.fn() };
    TestBed.configureTestingModule({
      imports: [RejectDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { shop: 'Shop Mẫu' } },
        { provide: MatDialogRef, useValue: mockRef },
      ],
    });
    const fixture = TestBed.createComponent(RejectDialogComponent);
    fixture.componentInstance.reason.setValue('   ngắn   ');
    fixture.componentInstance.confirm();
    expect(mockRef.close).not.toHaveBeenCalled();
    expect(fixture.componentInstance.errorMessage).toBeTruthy();
  });
});

describe('VendorApprovalService mock', () => {
  it('searches phone numbers without spaces and returns expected HTTP status errors', async () => {
    const service = new VendorApprovalService();
    const matches = await firstValueFrom(service.getVendors({ q: '0912345678' }));
    expect(matches.map((item) => item.id)).toEqual([1]);

    const expectStatus = async (request: ReturnType<VendorApprovalService['approveVendor']>, status: number) => {
      try {
        await firstValueFrom(request);
        expect.fail(`Expected HTTP ${status}`);
      } catch (error) {
        expect((error as HttpErrorResponse).status).toBe(status);
      }
    };
    await expectStatus(service.approveVendor(9999), 404);
    await expectStatus(service.rejectVendor(1, 'ngắn'), 422);
    await firstValueFrom(service.approveVendor(1));
    await expectStatus(service.approveVendor(1), 409);

    const term = await firstValueFrom(service.terminateVendorAccount(1, 'Bán hàng giả', 'Bán hàng giả nhái thương hiệu'));
    expect(term.status).toBe('REJECTED');
    expect(term.reason).toContain('Bán hàng giả');
  });

  it('syncs customer submitted draft into admin vendor list', async () => {
    const service = new VendorApprovalService();
    const testDraft = {
      status: 'PENDING',
      shopInfo: { shopName: 'Shop Mới Của Khách', businessType: 'INDIVIDUAL', primaryCategory: 'Thời trang', description: 'Mô tả' },
      contactInfo: { representativeName: 'Trần Văn Mới', email: 'moi@test.vn', phone: '0988 999 888', detailedAddress: '123 Cầu Giấy', ward: 'Dịch Vọng', district: 'Cầu Giấy', province: 'Hà Nội' },
      kycInfo: { taxCode: '123456789' }
    };
    localStorage.setItem('vic_seller_onboarding_draft', JSON.stringify(testDraft));
    const vendors = await firstValueFrom(service.getVendors());
    const found = vendors.find(v => v.shop === 'Shop Mới Của Khách');
    expect(found).toBeTruthy();
    expect(found?.owner).toBe('Trần Văn Mới');
    expect(found?.status).toBe('PENDING');

    // Admin duyệt shop này -> Kiểm tra draft của khách hàng được cập nhật
    if (found) {
      await firstValueFrom(service.approveVendor(found.id));
      const updatedDraft = JSON.parse(localStorage.getItem('vic_seller_onboarding_draft') || '{}');
      expect(updatedDraft.status).toBe('APPROVED');
    }
  });
});
