import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY_EMAIL = 'vic_fp_email';
const STORAGE_KEY_OTP = 'vic_fp_otp';
const STORAGE_KEY_VERIFIED = 'vic_fp_verified';

@Injectable({
  providedIn: 'root',
})
export class ForgotPasswordStateService {
  private readonly _email = signal<string>(sessionStorage.getItem(STORAGE_KEY_EMAIL) ?? '');
  private readonly _otp = signal<string>(sessionStorage.getItem(STORAGE_KEY_OTP) ?? '');
  private readonly _otpVerified = signal<boolean>(
    sessionStorage.getItem(STORAGE_KEY_VERIFIED) === 'true'
  );

  readonly email = this._email.asReadonly();
  readonly otp = this._otp.asReadonly();
  readonly otpVerified = this._otpVerified.asReadonly();

  readonly maskedEmail = computed(() => {
    const raw = this._email().trim();
    if (!raw || !raw.includes('@')) return raw;
    const [local, domain] = raw.split('@');
    if (local.length <= 2) {
      return `${local[0] ?? '*'}***@${domain}`;
    }
    return `${local.slice(0, 2)}${'*'.repeat(Math.min(5, Math.max(3, local.length - 2)))}@${domain}`;
  });

  setEmail(email: string): void {
    const normalized = email.trim().toLowerCase();
    this._email.set(normalized);
    this._otp.set('');
    this._otpVerified.set(false);
    sessionStorage.setItem(STORAGE_KEY_EMAIL, normalized);
    sessionStorage.removeItem(STORAGE_KEY_OTP);
    sessionStorage.removeItem(STORAGE_KEY_VERIFIED);
  }

  markOtpVerified(otpCode: string): void {
    this._otp.set(otpCode);
    this._otpVerified.set(true);
    sessionStorage.setItem(STORAGE_KEY_OTP, otpCode);
    sessionStorage.setItem(STORAGE_KEY_VERIFIED, 'true');
  }

  clear(): void {
    this._email.set('');
    this._otp.set('');
    this._otpVerified.set(false);
    sessionStorage.removeItem(STORAGE_KEY_EMAIL);
    sessionStorage.removeItem(STORAGE_KEY_OTP);
    sessionStorage.removeItem(STORAGE_KEY_VERIFIED);
  }
}
