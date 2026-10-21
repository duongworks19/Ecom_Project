import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthSplitLayoutComponent } from '../../components/auth-split-layout/auth-split-layout.component';
import { ForgotPasswordService } from '../../data-access/forgot-password.service';
import { ForgotPasswordStateService } from '../../data-access/forgot-password-state.service';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthSplitLayoutComponent],
  templateUrl: './forgot-password-page.component.html',
  styleUrl: './forgot-password-page.component.scss',
})
export class ForgotPasswordPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);
  private readonly stateService = inject(ForgotPasswordStateService);

  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    const savedEmail = this.stateService.email();
    if (savedEmail) {
      this.form.controls.email.setValue(savedEmail);
    }
  }

  onSubmit(): void {
    this.errorMessage.set(null);

    const normalizedEmail = this.form.controls.email.value.trim().toLowerCase();
    this.form.controls.email.setValue(normalizedEmail, { emitEvent: false });
    this.form.controls.email.markAsTouched({ onlySelf: true });

    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);

    this.forgotPasswordService.sendForgotPasswordOtp({ email: normalizedEmail }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.stateService.setEmail(normalizedEmail);
        void this.router.navigateByUrl('/verify-otp');
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const msg =
          err.error?.message ||
          (err.status === 422
            ? 'Địa chỉ email không đúng định dạng'
            : 'Đã xảy ra lỗi, vui lòng thử lại sau');
        this.errorMessage.set(msg);
      },
    });
  }
}
