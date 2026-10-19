import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ProfileApiService } from '../../data-access/profile-api.service';
import { CustomerProfile } from '../../data-access/profile.models';
import { ApiError } from '../../../../../core/api/api-error.model';
import {
  formatVnPhoneDisplay,
  normalizeVnPhone,
  vnPhoneValidator,
} from '../../../../../shared/validators/vn-phone.validator';
import { MaskEmailPipe } from '../../../../../shared/pipes/mask-email.pipe';
import { MaskPhonePipe } from '../../../../../shared/pipes/mask-phone.pipe';
import { FormFieldComponent } from '../../../../../shared/ui/form-field/form-field.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { SkeletonComponent } from '../../../../../shared/ui/skeleton/skeleton.component';
import { ErrorStateComponent } from '../../../../../shared/ui/error-state/error-state.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { AvatarUploaderComponent } from '../../components/avatar-uploader/avatar-uploader.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MaskEmailPipe,
    MaskPhonePipe,
    FormFieldComponent,
    ButtonComponent,
    SkeletonComponent,
    ErrorStateComponent,
    AvatarUploaderComponent,
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  readonly profileService = inject(ProfileApiService);
  private readonly toastService = inject(ToastService);

  readonly isEditingPhone = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly uploadingAvatar = signal<boolean>(false);
  readonly submitError = signal<string | null>(null);
  readonly phoneServerError = signal<string | null>(null);
  readonly fullNameServerError = signal<string | null>(null);

  @ViewChild('phoneInput') phoneInput?: ElementRef<HTMLInputElement>;

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    phone: ['', [Validators.required, vnPhoneValidator()]],
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.submitError.set(null);
    this.profileService.getProfile().subscribe({
      next: (profile) => this.patchFormFromProfile(profile),
      error: () => undefined,
    });
  }

  enablePhoneEditing(): void {
    this.isEditingPhone.set(true);
    setTimeout(() => this.phoneInput?.nativeElement.focus(), 0);
  }

  cancelPhoneEditing(): void {
    const current = this.profileService.profile();
    if (current) {
      this.form.controls.phone.setValue(formatVnPhoneDisplay(current.phone));
      this.form.controls.phone.markAsPristine();
      this.form.controls.phone.markAsUntouched();
    }
    this.phoneServerError.set(null);
    this.isEditingPhone.set(false);
  }

  get fullNameError(): string | null {
    if (this.fullNameServerError()) {
      return this.fullNameServerError();
    }
    const ctrl = this.form.controls.fullName;
    if (!ctrl.touched && !ctrl.dirty) {
      return null;
    }
    if (ctrl.hasError('required')) {
      return 'Vui lòng nhập họ và tên.';
    }
    if (ctrl.hasError('minlength')) {
      return 'Họ và tên phải có ít nhất 2 ký tự.';
    }
    if (ctrl.hasError('maxlength')) {
      return 'Họ và tên không vượt quá 80 ký tự.';
    }
    return null;
  }

  get phoneError(): string | null {
    if (this.phoneServerError()) {
      return this.phoneServerError();
    }
    const ctrl = this.form.controls.phone;
    if (!ctrl.touched && !ctrl.dirty) {
      return null;
    }
    if (ctrl.hasError('required')) {
      return 'Vui lòng nhập số điện thoại.';
    }
    if (ctrl.hasError('vnPhone')) {
      return 'Số điện thoại không hợp lệ (10 chữ số, bắt đầu bằng 0).';
    }
    return null;
  }

  onSave(): void {
    this.submitError.set(null);
    this.phoneServerError.set(null);
    this.fullNameServerError.set(null);

    const trimmedName = this.form.controls.fullName.value.trim();
    this.form.controls.fullName.setValue(trimmedName);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const normalizedPhone = normalizeVnPhone(this.form.controls.phone.value);
    this.saving.set(true);

    this.profileService
      .updateProfile({
        fullName: trimmedName,
        phone: normalizedPhone,
      })
      .subscribe({
        next: (updated) => {
          this.saving.set(false);
          this.patchFormFromProfile(updated);
          this.isEditingPhone.set(false);
          this.toastService.success('Đã lưu thay đổi hồ sơ.');
        },
        error: (err: ApiError) => {
          this.saving.set(false);
          if (err.field === 'phone') {
            this.isEditingPhone.set(true);
            this.phoneServerError.set(err.message);
          } else if (err.field === 'fullName') {
            this.fullNameServerError.set(err.message);
          } else {
            this.submitError.set(err.message);
          }
        },
      });
  }

  onAvatarSelected(file: File): void {
    this.uploadingAvatar.set(true);
    this.profileService.uploadAvatar(file).subscribe({
      next: () => {
        this.uploadingAvatar.set(false);
        this.toastService.success('Đã cập nhật ảnh đại diện.');
      },
      error: (err: ApiError) => {
        this.uploadingAvatar.set(false);
        this.toastService.error(err.message);
      },
    });
  }

  private patchFormFromProfile(profile: CustomerProfile): void {
    this.form.reset({
      fullName: profile.fullName ?? '',
      phone: formatVnPhoneDisplay(profile.phone ?? ''),
    });
  }
}
