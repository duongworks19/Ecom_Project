import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ShipperService } from '../../services/shipper.service';
import { ShipperWorkStatus, VehicleType } from '../../models/shipper.models';

@Component({
  selector: 'vic-admin-shipper-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-shipper-form.component.html',
  styleUrl: './admin-shipper-form.component.scss',
})
export class AdminShipperFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly shipperService = inject(ShipperService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly isEditMode = signal<boolean>(false);
  readonly shipperId = signal<number | null>(null);
  readonly isSubmitting = signal<boolean>(false);
  readonly generalError = signal<string | null>(null);

  readonly vehicleTypes: VehicleType[] = ['Xe máy', 'Xe đạp điện', 'Xe tải nhỏ'];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required]],
    phone: ['', [Validators.required, Validators.pattern(/^0\d{9}$/)]],
    email: ['', [Validators.required, Validators.email]],
    vehicleType: ['Xe máy' as VehicleType, [Validators.required]],
    licensePlate: ['', [Validators.required]],
    serviceArea: ['', [Validators.required]],
    workStatus: ['AVAILABLE' as ShipperWorkStatus],
    sendTempPasswordByEmail: [true],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.isEditMode.set(true);
      this.shipperId.set(id);
      this.loadShipperForEdit(id);
    }
  }

  onSubmit(): void {
    this.generalError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    if (this.isEditMode() && this.shipperId() !== null) {
      this.shipperService
        .updateShipper(this.shipperId()!, {
          fullName: raw.fullName,
          phone: raw.phone,
          vehicleType: raw.vehicleType,
          licensePlate: raw.licensePlate,
          serviceArea: raw.serviceArea,
          workStatus: raw.workStatus,
        })
        .subscribe({
          next: (updated) => {
            this.isSubmitting.set(false);
            void this.router.navigate(['/admin/shippers'], {
              queryParams: { notice: `Đã cập nhật thông tin shipper ${updated.fullName}` },
            });
          },
          error: (err: HttpErrorResponse) => this.handleApiError(err),
        });
    } else {
      this.shipperService
        .createShipper({
          fullName: raw.fullName,
          phone: raw.phone,
          email: raw.email,
          vehicleType: raw.vehicleType,
          licensePlate: raw.licensePlate,
          serviceArea: raw.serviceArea,
          sendTempPasswordByEmail: raw.sendTempPasswordByEmail,
        })
        .subscribe({
          next: (created) => {
            this.isSubmitting.set(false);
            void this.router.navigate(['/admin/shippers'], {
              queryParams: { notice: `Đã tạo tài khoản shipper ${created.fullName} thành công` },
            });
          },
          error: (err: HttpErrorResponse) => this.handleApiError(err),
        });
    }
  }

  private loadShipperForEdit(id: number): void {
    this.shipperService.getShipperDetail(id).subscribe({
      next: (shipper) => {
        this.form.patchValue({
          fullName: shipper.fullName,
          phone: shipper.phone.replace(/\s+/g, ''),
          email: shipper.email,
          vehicleType: shipper.vehicleType,
          licensePlate: shipper.licensePlate,
          serviceArea: shipper.serviceArea,
          workStatus: shipper.workStatus,
        });
      },
      error: () => {
        this.generalError.set('Không tìm thấy thông tin shipper cần chỉnh sửa.');
      },
    });
  }

  private handleApiError(err: HttpErrorResponse): void {
    this.isSubmitting.set(false);
    if (err.status === 409 && err.error?.field) {
      const field = err.error.field as 'email' | 'phone';
      const control = this.form.controls[field];
      if (control) {
        control.setErrors({ duplicate: err.error.message || 'Thông tin đã tồn tại trên hệ thống' });
        control.markAsTouched();
        return;
      }
    }
    this.generalError.set(err.error?.message || 'Có lỗi xảy ra, vui lòng kiểm tra lại thông tin.');
  }
}
