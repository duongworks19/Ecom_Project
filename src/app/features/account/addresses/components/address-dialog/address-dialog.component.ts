import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerAddress, UpsertCustomerAddressRequest } from '../../data-access/addresses.models';
import {
  formatVnPhoneDisplay,
  normalizeVnPhone,
  vnPhoneValidator,
} from '../../../../../shared/validators/vn-phone.validator';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { FormFieldComponent } from '../../../../../shared/ui/form-field/form-field.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-address-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, DialogComponent, FormFieldComponent, ButtonComponent],
  templateUrl: './address-dialog.component.html',
  styleUrl: './address-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddressDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input<boolean>(false);
  readonly initialAddress = input<CustomerAddress | null>(null);
  readonly saving = input<boolean>(false);
  readonly serverError = input<string | null>(null);

  readonly saved = output<UpsertCustomerAddressRequest>();
  readonly cancelled = output<void>();

  readonly dialogTitle = computed(() =>
    this.initialAddress() ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'
  );

  readonly isLockedDefault = computed(() => Boolean(this.initialAddress()?.isDefault));

  readonly form = this.fb.nonNullable.group({
    recipientName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.required, vnPhoneValidator()]],
    province: ['', [Validators.required, Validators.maxLength(80)]],
    district: ['', [Validators.required, Validators.maxLength(80)]],
    ward: ['', [Validators.required, Validators.maxLength(80)]],
    streetAddress: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
    ],
    isDefault: [false],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      const addr = this.initialAddress();
      if (!isOpen) {
        return;
      }
      if (addr) {
        this.form.reset({
          recipientName: addr.recipientName,
          phone: formatVnPhoneDisplay(addr.phone),
          province: addr.province,
          district: addr.district,
          ward: addr.ward,
          streetAddress: addr.streetAddress,
          isDefault: addr.isDefault,
        });
        if (addr.isDefault) {
          this.form.controls.isDefault.disable();
        } else {
          this.form.controls.isDefault.enable();
        }
      } else {
        this.form.controls.isDefault.enable();
        this.form.reset({
          recipientName: '',
          phone: '',
          province: '',
          district: '',
          ward: '',
          streetAddress: '',
          isDefault: false,
        });
      }
    });
  }

  getError(
    fieldName:
      | 'recipientName'
      | 'phone'
      | 'province'
      | 'district'
      | 'ward'
      | 'streetAddress'
  ): string | null {
    const ctrl = this.form.controls[fieldName];
    if (!ctrl.touched && !ctrl.dirty) {
      return null;
    }
    if (ctrl.hasError('required')) {
      return 'Trường này là bắt buộc.';
    }
    if (ctrl.hasError('vnPhone')) {
      return 'Số điện thoại gồm 10 chữ số, bắt đầu bằng 0.';
    }
    if (ctrl.hasError('minlength')) {
      return fieldName === 'streetAddress'
        ? 'Địa chỉ cụ thể tối thiểu 5 ký tự.'
        : 'Họ và tên tối thiểu 2 ký tự.';
    }
    if (ctrl.hasError('maxlength')) {
      return 'Vượt quá độ dài cho phép.';
    }
    return null;
  }

  onSubmit(): void {
    const raw = this.form.getRawValue();
    this.form.patchValue({
      recipientName: raw.recipientName.trim(),
      province: raw.province.trim(),
      district: raw.district.trim(),
      ward: raw.ward.trim(),
      streetAddress: raw.streetAddress.trim(),
    });

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const clean = this.form.getRawValue();
    this.saved.emit({
      recipientName: clean.recipientName.trim(),
      phone: normalizeVnPhone(clean.phone),
      province: clean.province.trim(),
      district: clean.district.trim(),
      ward: clean.ward.trim(),
      streetAddress: clean.streetAddress.trim(),
      isDefault: this.isLockedDefault() ? true : Boolean(clean.isDefault),
    });
  }

  onClose(): void {
    if (!this.saving()) {
      this.cancelled.emit();
    }
  }
}
