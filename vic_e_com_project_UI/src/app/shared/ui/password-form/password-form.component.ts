import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { mapHttpError } from '../../../core/api/api-error.mapper';

/**
 * Form đổi mật khẩu dùng chung: 3 ô, nút Hiện/Ẩn, danh sách quy tắc,
 * chặn submit theo hợp lệ, và lỗi "mật khẩu hiện tại sai" (400).
 *
 * ponytail: form này tự gọi AuthService.changePassword. Khi backend
 * có endpoint thật thì chỉ cần sửa auth.service.ts (đã có TODO), không
 * sửa component này.
 */
@Component({
  selector: 'app-password-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './password-form.component.html',
  styleUrl: './password-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasswordFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  readonly showCurrent = signal<boolean>(false);
  readonly showNew = signal<boolean>(false);
  readonly showConfirm = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly changed = output<void>();

  readonly form = this.fb.nonNullable.group({
    currentPassword: ['', [Validators.required]],
    newPassword: ['', [Validators.required]],
    confirmPassword: ['', [Validators.required]],
  });

  private readonly formValues = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });

  readonly ruleMinLength = computed(() => (this.formValues().newPassword ?? '').length >= 8);
  readonly ruleUpperLowerNumber = computed(() => {
    const val = this.formValues().newPassword ?? '';
    return /[A-Z]/.test(val) && /[a-z]/.test(val) && /\d/.test(val);
  });
  readonly ruleDifferentFromCurrent = computed(() => {
    const cur = this.formValues().currentPassword ?? '';
    const next = this.formValues().newPassword ?? '';
    return next.length > 0 && next !== cur;
  });
  readonly ruleConfirmMatch = computed(() => {
    const next = this.formValues().newPassword ?? '';
    const confirm = this.formValues().confirmPassword ?? '';
    return confirm.length > 0 && next === confirm;
  });

  readonly isFormValid = computed(
    () =>
      (this.formValues().currentPassword ?? '').length > 0 &&
      this.ruleMinLength() &&
      this.ruleUpperLowerNumber() &&
      this.ruleDifferentFromCurrent() &&
      this.ruleConfirmMatch(),
  );

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.form.reset();
        this.changed.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 400) {
          this.form.controls.currentPassword.setErrors({
            incorrect: err.error?.message || 'Mật khẩu hiện tại không chính xác',
          });
          this.form.controls.currentPassword.markAsTouched();
          return;
        }
        if (err.status === 0) {
          this.errorMessage.set('Không kết nối được máy chủ, vui lòng thử lại');
          return;
        }
        if (err.status === 422) {
          this.errorMessage.set(mapHttpError(err).message);
          return;
        }
        if (err.status === 401) {
          // 401 do interceptor xử lý (hết phiên), không hiển thị ở đây
          return;
        }
        this.errorMessage.set('Không thể đổi mật khẩu, vui lòng thử lại sau');
      },
    });
  }
}
