import { Component, OnDestroy, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthSplitLayoutComponent } from '../../components/auth-split-layout/auth-split-layout.component';
import { OtpInputComponent } from '../../components/otp-input/otp-input.component';
import { ForgotPasswordService } from '../../data-access/forgot-password.service';
import { ForgotPasswordStateService } from '../../data-access/forgot-password-state.service';

@Component({
  selector: 'app-verify-otp-page',
  standalone: true,
  imports: [CommonModule, RouterLink, AuthSplitLayoutComponent, OtpInputComponent],
  templateUrl: './verify-otp-page.component.html',
  styleUrl: './verify-otp-page.component.scss',
})
export class VerifyOtpPageComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly forgotPasswordService = inject(ForgotPasswordService);
  private readonly stateService = inject(ForgotPasswordStateService);

  @ViewChild(OtpInputComponent) otpInputRef?: OtpInputComponent;

  readonly email = this.stateService.email;
  readonly maskedEmail = this.stateService.maskedEmail;

  readonly otpCode = signal<string>('');
  readonly isSubmitting = signal<boolean>(false);
  readonly isResending = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly resendSuccessMessage = signal<string | null>(null);
  readonly countdown = signal<number>(60);

  readonly isOtpComplete = computed(() => /^\d{6}$/.test(this.otpCode()));
  readonly canResend = computed(
    () => this.countdown() === 0 && !this.isResending() && !this.isSubmitting()
  );

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    if (!this.email()) {
      void this.router.navigateByUrl('/forgot-password');
      return;
    }
    this.startCountdown(60);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  onOtpChange(code: string): void {
    this.otpCode.set(code);
    if (this.errorMessage()) {
      this.errorMessage.set(null);
    }
  }

  onOtpComplete(code: string): void {
    this.otpCode.set(code);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (!this.isOtpComplete() || this.isSubmitting()) {
      if (!this.isOtpComplete()) {
        this.errorMessage.set('Vui lòng nhập đầy đủ 6 chữ số mã OTP');
      }
      return;
    }

    this.errorMessage.set(null);
    this.resendSuccessMessage.set(null);
    this.isSubmitting.set(true);

    const currentOtp = this.otpCode();
    this.forgotPasswordService
      .verifyOtp({
        email: this.email(),
        otp: currentOtp,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.stateService.markOtpVerified(currentOtp);
          void this.router.navigateByUrl('/reset-password');
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          const msg = err.error?.message || 'Mã không đúng hoặc đã hết hạn';
          this.errorMessage.set(msg);
        },
      });
  }

  onResendOtp(): void {
    if (!this.canResend()) return;

    this.errorMessage.set(null);
    this.resendSuccessMessage.set(null);
    this.isResending.set(true);

    this.forgotPasswordService.resendOtp(this.email()).subscribe({
      next: () => {
        this.isResending.set(false);
        this.otpInputRef?.clear();
        this.resendSuccessMessage.set('Đã gửi lại mã OTP mới vào hộp thư của bạn.');
        this.startCountdown(60);
      },
      error: () => {
        this.isResending.set(false);
        this.startCountdown(60);
      },
    });
  }

  private startCountdown(seconds: number): void {
    this.clearTimer();
    this.countdown.set(seconds);
    this.timerId = setInterval(() => {
      const current = this.countdown();
      if (current <= 1) {
        this.countdown.set(0);
        this.clearTimer();
      } else {
        this.countdown.set(current - 1);
      }
    }, 1000);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}
