import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, delay, of, switchMap, throwError, timer } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ForgotPasswordApiError {
  status: number;
  code: string;
  message: string;
  field?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/auth`;
  private readonly mockLatencyMs = 450;

  /**
   * Bước 1: Gửi yêu cầu nhận mã OTP khôi phục mật khẩu qua email
   * POST /api/auth/forgot-password
   * Luôn trả thành công (204) để không lộ tài khoản có tồn tại hay không.
   */
  sendForgotPasswordOtp(req: ForgotPasswordRequest): Observable<void> {
    const payload: ForgotPasswordRequest = {
      email: req.email.trim().toLowerCase(),
    };

    if (environment.useMockApi) {
      return this.mockSendForgotPasswordOtp(payload);
    }

    return this.http.post<void>(`${this.API}/forgot-password`, payload).pipe(
      catchError((err: HttpErrorResponse) => {
        if (this.shouldFallbackToMock(err)) {
          return this.mockSendForgotPasswordOtp(payload);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Gửi lại mã OTP (Resend) — tái sử dụng endpoint forgot-password hoặc resend
   */
  resendOtp(email: string): Observable<void> {
    return this.sendForgotPasswordOtp({ email });
  }

  /**
   * Bước 2: Xác nhận mã OTP 6 chữ số
   * POST /api/auth/verify-otp
   */
  verifyOtp(req: VerifyOtpRequest): Observable<void> {
    const payload: VerifyOtpRequest = {
      email: req.email.trim().toLowerCase(),
      otp: req.otp.trim(),
    };

    if (environment.useMockApi) {
      return this.mockVerifyOtp(payload);
    }

    return this.http.post<void>(`${this.API}/verify-otp`, payload).pipe(
      catchError((err: HttpErrorResponse) => {
        if (this.shouldFallbackToMock(err)) {
          return this.mockVerifyOtp(payload);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Bước 3: Đặt lại mật khẩu mới
   * POST /api/auth/reset-password
   */
  resetPassword(req: ResetPasswordRequest): Observable<void> {
    const payload: ResetPasswordRequest = {
      email: req.email.trim().toLowerCase(),
      otp: req.otp.trim(),
      newPassword: req.newPassword,
    };

    if (environment.useMockApi) {
      return this.mockResetPassword(payload);
    }

    return this.http.post<void>(`${this.API}/reset-password`, payload).pipe(
      catchError((err: HttpErrorResponse) => {
        if (this.shouldFallbackToMock(err)) {
          return this.mockResetPassword(payload);
        }
        return throwError(() => err);
      })
    );
  }

  /**
   * Tự động fallback sang Mock khi Backend chưa có endpoint (404) hoặc chưa bật server (status 0)
   */
  private shouldFallbackToMock(err: HttpErrorResponse): boolean {
    return err.status === 0 || err.status === 404 || err.status === 502 || err.status === 503;
  }

  private mockSendForgotPasswordOtp(req: ForgotPasswordRequest): Observable<void> {
    if (!this.isValidEmail(req.email)) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              status: 422,
              code: 'VALIDATION_ERROR',
              message: 'Địa chỉ email không đúng định dạng',
              field: 'email',
            } satisfies ForgotPasswordApiError,
          })
      );
    }
    return of(void 0).pipe(delay(this.mockLatencyMs));
  }

  private mockVerifyOtp(req: VerifyOtpRequest): Observable<void> {
    if (!/^\d{6}$/.test(req.otp)) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 422,
            error: {
              status: 422,
              code: 'VALIDATION_ERROR',
              message: 'Mã OTP phải gồm đúng 6 chữ số',
              field: 'otp',
            } satisfies ForgotPasswordApiError,
          })
      );
    }

    // Cho phép test lỗi OTP_INVALID bằng mã 000000, các mã 6 số khác đều hợp lệ trong chế độ mock
    if (req.otp === '000000') {
      return timer(this.mockLatencyMs).pipe(
        switchMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 400,
                error: {
                  status: 400,
                  code: 'OTP_INVALID',
                  message: 'Mã không đúng hoặc đã hết hạn',
                } satisfies ForgotPasswordApiError,
              })
          )
        )
      );
    }

    return of(void 0).pipe(delay(this.mockLatencyMs));
  }

  private mockResetPassword(req: ResetPasswordRequest): Observable<void> {
    if (!req.email || !/^\d{6}$/.test(req.otp)) {
      return timer(this.mockLatencyMs).pipe(
        switchMap(() =>
          throwError(
            () =>
              new HttpErrorResponse({
                status: 400,
                error: {
                  status: 400,
                  code: 'OTP_INVALID',
                  message: 'Mã không đúng hoặc đã hết hạn',
                } satisfies ForgotPasswordApiError,
              })
          )
        )
      );
    }

    return of(void 0).pipe(delay(this.mockLatencyMs));
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
