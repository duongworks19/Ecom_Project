import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ShipperProfile, UpdateShipperProfileRequest } from '../../models/shipper.models';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-update-profile-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DialogComponent],
  templateUrl: './update-profile-dialog.component.html',
  styleUrl: './update-profile-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateProfileDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly shipperService = inject(ShipperPortalService);
  private readonly toastService = inject(ToastService);

  readonly open = input<boolean>(false);
  readonly profile = input<ShipperProfile | null>(null);

  readonly closed = output<void>();
  readonly saved = output<ShipperProfile>();

  readonly isSubmitting = signal<boolean>(false);
  readonly serverError = signal<string | null>(null);

  readonly vehicleTypes = ['Xe máy', 'Xe tải nhỏ', 'Xe ba gác', 'Xe điện', 'Ô tô'];

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    phone: ['', [Validators.required, Validators.pattern(/^0(3|5|7|8|9)\d{8}$/)]],
    vehicleType: ['Xe máy', [Validators.required, Validators.maxLength(50)]],
    licensePlate: ['', [Validators.required, Validators.maxLength(20)]],
    serviceArea: ['', [Validators.required, Validators.maxLength(255)]],
  });

  constructor() {
    effect(() => {
      const p = this.profile();
      const isOpen = this.open();
      if (isOpen && p) {
        this.form.reset({
          fullName: p.fullName || '',
          phone: p.phone || '',
          vehicleType: p.vehicleType || 'Xe máy',
          licensePlate: p.licensePlate || '',
          serviceArea: p.serviceArea || '',
        });
        this.serverError.set(null);
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.serverError.set(null);
    this.isSubmitting.set(true);

    const raw = this.form.getRawValue();
    const payload: UpdateShipperProfileRequest = {
      fullName: raw.fullName.trim(),
      phone: raw.phone.trim(),
      vehicleType: raw.vehicleType.trim(),
      licensePlate: raw.licensePlate.trim().toUpperCase(),
      serviceArea: raw.serviceArea.trim(),
    };

    this.shipperService.updateProfile(payload).subscribe({
      next: (updatedProfile) => {
        this.isSubmitting.set(false);
        this.toastService.success('Cập nhật thông tin shipper thành công!');
        this.saved.emit(updatedProfile);
        this.closed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message || 'Có lỗi xảy ra khi cập nhật thông tin';
        this.serverError.set(msg);
      },
    });
  }

  onCancel(): void {
    this.serverError.set(null);
    this.closed.emit();
  }
}
