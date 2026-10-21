import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthSplitLayoutComponent } from '../../components/auth-split-layout/auth-split-layout.component';
import { ForgotPasswordService } from '../../data-access/forgot-password.service';
import { ForgotPasswordStateService } from '../../data-access/forgot-password-state.service';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AuthSplitLayoutComponent],
  templateUrl: './reset-password-page.component.html',
  styleUrl: './reset-password-page.component.scss',
})
export class ResetPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);
  private readonly stateService = inject(ForgotPasswordStateService);

  readonly email = this.stateService.email;
  readonly showNewPassword = signal<boolean>(false);
  readonly showConfirmPassword = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
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
  readonly ruleConfirmMatch = computed(() => {
    const next = this.formValues().newPassword ?? '';
    const confirm = this.formValues().confirmPassword ?? '';
    return confirm.length > 0 && next === confirm;
  });

  readonly isFormValid = computed(
    () => this.ruleMinLength() && this.ruleUpperLowerNumber() && this.ruleConfirmMatch()
  );

  ngOnInit(): void {
    if (!this.stateService.email() || !this.stateService.otpVerified()) {
      void this.router.navigateByUrl('/forgot-password');
    }
  }

  onSubmit(): void {
    if (!this.isFormValid() || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.errorMessage.set(null);
    this.isSubmitting.set(true);

    const { newPassword } = this.form.getRawValue();

    this.forgotPasswordService
      .resetPassword({
        email: this.stateService.email(),
        otp: this.stateService.otp(),
        newPassword,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set(
            'Đặt lại mật khẩu thành công! Đang chuyển về trang đăng nhập...'
          );
          this.stateService.clear();
          setTimeout(() => void this.router.navigateByUrl('/login'), 1200);
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          const msg =
            err.error?.message || 'Không thể đặt lại mật khẩu, mã OTP có thể đã hết hạn.';
          this.errorMessage.set(msg);
        },
      });
  }
}
