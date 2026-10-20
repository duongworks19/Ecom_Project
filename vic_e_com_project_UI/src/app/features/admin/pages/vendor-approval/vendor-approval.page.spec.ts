import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom, of } from 'rxjs';
import { RejectDialogComponent } from './reject-dialog.component';
import { VendorApprovalPage } from './vendor-approval.page';
import { VendorApplication, VendorApprovalService } from '../../services/vendor-approval.service';

const pendingVendor: VendorApplication = {
  id: 10,
  businessName: 'Shop Mẫu',
  ownerName: 'Nguyễn An',
  email: 'an@example.vn',
  phone: '090 123 4567',
  businessModel: 'Cá nhân',
  category: 'Thời trang',
  pickupAddress: 'Hà Nội',
  kycDocuments: [{ label: 'CCCD' }],
  approvalStatus: 'PENDING',
  submittedAt: '2026-10-18T09:00:00+07:00',
};

describe('VendorApprovalPage', () => {
  let fixture: ComponentFixture<VendorApprovalPage>;
  let service: {
    getVendors: ReturnType<typeof vi.fn>;
    getVendor: ReturnType<typeof vi.fn>;
    approveVendor: ReturnType<typeof vi.fn>;
    rejectVendor: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    service = {
      getVendors: vi.fn(() => of([pendingVendor])),
      getVendor: vi.fn(() => of(pendingVendor)),
      approveVendor: vi.fn((id: number) => of({ ...pendingVendor, id, approvalStatus: 'APPROVED' })),
      rejectVendor: vi.fn((id: number, reason: string) => of({ ...pendingVendor, id, approvalStatus: 'REJECTED', rejectReason: reason })),
    };
    TestBed.configureTestingModule({
      imports: [VendorApprovalPage],
      providers: [
        { provide: VendorApprovalService, useValue: service },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
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
    expect(page.canApprove()).toBe(false);
    page.toggleCheck(0, true);
    page.toggleCheck(1, true);
    page.toggleCheck(2, true);
    expect(page.canApprove()).toBe(false);
    page.toggleCheck(3, true);
    expect(page.canApprove()).toBe(true);
  });

  it('updates list status after approval and rejects once with a valid reason', () => {
    const page = fixture.componentInstance;
    page.toggleCheck(0, true);
    page.toggleCheck(1, true);
    page.toggleCheck(2, true);
    page.toggleCheck(3, true);
    page.approve();
    expect(service.approveVendor).toHaveBeenCalledTimes(1);
    expect(page.applications()[0].approvalStatus).toBe('APPROVED');

    page['selectedVendor'].set(pendingVendor);
    expect(page.selectedVendor()?.approvalStatus).toBe('PENDING');
    expect(page.submitting()).toBe(false);
    page.openRejectDialog();
    expect((page as unknown as { dialog: MatDialog }).dialog.open).toHaveBeenCalledTimes(1);
    expect(service.rejectVendor).toHaveBeenCalledTimes(1);
    expect(service.rejectVendor).toHaveBeenCalledWith(10, 'Giấy tờ chưa rõ nét, vui lòng gửi lại.');
    expect(page.applications()[0].approvalStatus).toBe('REJECTED');
  });
});

describe('RejectDialogComponent', () => {
  it('blocks reasons shorter than 10 characters after trimming', () => {
    TestBed.configureTestingModule({
      imports: [RejectDialogComponent],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { businessName: 'Shop Mẫu' } },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(RejectDialogComponent);
    fixture.componentInstance.reason.setValue('   ngắn   ');
    expect(fixture.componentInstance.valid).toBe(false);
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
  });
});
