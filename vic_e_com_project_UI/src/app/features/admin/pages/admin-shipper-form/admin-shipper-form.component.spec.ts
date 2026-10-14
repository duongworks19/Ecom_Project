import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminShipperFormComponent } from './admin-shipper-form.component';
import { ShipperService } from '../../services/shipper.service';

describe('AdminShipperFormComponent', () => {
  let component: AdminShipperFormComponent;
  let fixture: ComponentFixture<AdminShipperFormComponent>;
  let shipperServiceMock: {
    createShipper: ReturnType<typeof vi.fn>;
    updateShipper: ReturnType<typeof vi.fn>;
    getShipperDetail: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    shipperServiceMock = {
      createShipper: vi.fn(),
      updateShipper: vi.fn(),
      getShipperDetail: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [AdminShipperFormComponent],
      providers: [
        provideRouter([]),
        { provide: ShipperService, useValue: shipperServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminShipperFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('validates required fields and Vietnam phone format', () => {
    expect(component.form.valid).toBe(false);

    component.form.patchValue({
      fullName: 'Lê Hoàng Nam',
      phone: '12345',
      email: 'nam.shipper@vicmart.vn',
      vehicleType: 'Xe máy',
      licensePlate: '59-X1 123.45',
      serviceArea: 'Quận 3, TP.HCM',
    });
    expect(component.form.controls.phone.hasError('pattern')).toBe(true);

    component.form.patchValue({ phone: '0912345678' });
    expect(component.form.valid).toBe(true);
  });

  it('maps 409 email duplicate conflict to email control error', () => {
    shipperServiceMock.createShipper.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { field: 'email', message: 'Email đã tồn tại trong hệ thống' },
          })
      )
    );

    component.form.patchValue({
      fullName: 'Lê Hoàng Nam',
      phone: '0912345678',
      email: 'duplicate@vicmart.vn',
      vehicleType: 'Xe máy',
      licensePlate: '59-X1 123.45',
      serviceArea: 'Quận 3, TP.HCM',
    });

    component.onSubmit();
    expect(component.form.controls.email.hasError('duplicate')).toBe(true);
  });
});
