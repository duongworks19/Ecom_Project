import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
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

  sendForgotPasswordOtp(req: ForgotPasswordRequest): Observable<void> {
    const payload: ForgotPasswordRequest = {
      email: req.email.trim().toLowerCase(),
    };
    return this.http.post<void>(`${this.API}/forgot-password`, payload);
  }

  resendOtp(email: string): Observable<void> {
    return this.sendForgotPasswordOtp({ email });
  }

  verifyOtp(req: VerifyOtpRequest): Observable<void> {
    const payload: VerifyOtpRequest = {
      email: req.email.trim().toLowerCase(),
      otp: req.otp.trim(),
    };
    return this.http.post<void>(`${this.API}/verify-otp`, payload);
  }

  resetPassword(req: ResetPasswordRequest): Observable<void> {
    const payload: ResetPasswordRequest = {
      email: req.email.trim().toLowerCase(),
      otp: req.otp.trim(),
      newPassword: req.newPassword,
    };
    return this.http.post<void>(`${this.API}/reset-password`, payload);
  }
}
