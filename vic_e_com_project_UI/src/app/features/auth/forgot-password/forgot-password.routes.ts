import { Routes } from '@angular/router';
import { passwordChangeGuard } from '../../../core/guards/password-change.guard';

export const FORGOT_PASSWORD_ROUTES: Routes = [
  {
    path: 'forgot-password',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./pages/forgot-password-page/forgot-password-page.component').then(
        (m) => m.ForgotPasswordPageComponent
      ),
    title: 'Quên mật khẩu — VIC MART',
  },
  {
    path: 'verify-otp',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./verify-otp/verify-otp-page/verify-otp-page.component').then(
        (m) => m.VerifyOtpPageComponent
      ),
    title: 'Nhập mã xác nhận OTP — VIC MART',
  },
  {
    path: 'reset-password',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./reset-password/reset-password-page/reset-password-page.component').then(
        (m) => m.ResetPasswordPageComponent
      ),
    title: 'Đặt lại mật khẩu — VIC MART',
  },
];
