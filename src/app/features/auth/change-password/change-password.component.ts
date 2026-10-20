import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'vic-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss',
})
export class ChangePasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showCurrent = signal<boolean>(false);
  readonly showNew = signal<boolean>(false);
  readonly showConfirm = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly successMessage = signal<string | null>(null);

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
      this.ruleConfirmMatch()
  );

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set('Đổi mật khẩu thành công! Đang chuyển hướng...');
        const target = this.authService.getRole() === 'ADMIN' ? '/admin' : '/';
        setTimeout(() => void this.router.navigateByUrl(target), 800);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        if (err.status === 400) {
          this.form.controls.currentPassword.setErrors({
            incorrect: err.error?.message || 'Mật khẩu hiện tại không chính xác',
          });
          this.form.controls.currentPassword.markAsTouched();
        }
      },
    });
  }

  onLogout(): void {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
