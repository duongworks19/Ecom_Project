import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, finalize, map, of, tap, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { ApiError } from '../../../../core/api/api-error.model';
import { mapHttpError } from '../../../../core/api/api-error.mapper';
import { AuthService } from '../../../../core/services/auth.service';
import {
  CustomerProfile,
  UpdateCustomerProfileRequest,
  UploadAvatarResponse,
} from './profile.models';
import { PROFILE_ENDPOINTS } from './profile.endpoints';

interface WrappedResponse<T> {
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly authService = inject(AuthService);

  readonly profile = signal<CustomerProfile | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<ApiError | null>(null);

  readonly displayName = computed(() => {
    const loadedName = this.profile()?.fullName?.trim();
    if (loadedName) {
      return loadedName;
    }
    return this.authService.currentUserNameSignal() ?? '';
  });

  readonly avatarUrl = computed(() => this.profile()?.avatarUrl ?? null);

  getProfile(): Observable<CustomerProfile> {
    this.loading.set(true);
    this.error.set(null);

    return this.http
      .get<CustomerProfile | WrappedResponse<CustomerProfile>>(
        `${this.baseUrl}${PROFILE_ENDPOINTS.profile}`
      )
      .pipe(
        map((res) => this.unwrap<CustomerProfile>(res)),
        tap((profile) => {
          this.profile.set(profile);
          if (profile.fullName) {
            localStorage.setItem('fullName', profile.fullName);
            this.authService.currentUserNameSignal.set(profile.fullName);
          }
        }),
        catchError((err) => {
          const mapped = mapHttpError(err);
          this.error.set(mapped);
          return throwError(() => mapped);
        }),
        finalize(() => this.loading.set(false))
      );
  }

  ensureProfileLoaded(): void {
    if (!this.profile() && !this.loading()) {
      this.getProfile().subscribe({ error: () => undefined });
    }
  }

  updateProfile(payload: UpdateCustomerProfileRequest): Observable<CustomerProfile> {
    return this.http
      .put<CustomerProfile | WrappedResponse<CustomerProfile>>(
        `${this.baseUrl}${PROFILE_ENDPOINTS.profile}`,
        payload
      )
      .pipe(
        map((res) => this.unwrap<CustomerProfile>(res)),
        tap((updated) => {
          this.profile.set(updated);
          if (updated.fullName) {
            localStorage.setItem('fullName', updated.fullName);
            this.authService.currentUserNameSignal.set(updated.fullName);
          }
        }),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  uploadAvatar(file: File): Observable<UploadAvatarResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<UploadAvatarResponse | WrappedResponse<UploadAvatarResponse>>(
        `${this.baseUrl}${PROFILE_ENDPOINTS.avatar}`,
        formData
      )
      .pipe(
        map((res) => this.unwrap<UploadAvatarResponse>(res)),
        tap((res) => {
          const current = this.profile();
          if (current) {
            this.profile.set({ ...current, avatarUrl: res.avatarUrl });
          }
        }),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<unknown>(`${this.baseUrl}${PROFILE_ENDPOINTS.logout}`, {})
      .pipe(
        map(() => undefined),
        catchError(() => of(undefined)),
        tap(() => {
          this.profile.set(null);
          this.error.set(null);
          this.authService.logout();
        })
      );
  }

  private unwrap<T>(res: T | WrappedResponse<T>): T {
    if (res && typeof res === 'object' && 'data' in res && (res as WrappedResponse<T>).data !== undefined) {
      return (res as WrappedResponse<T>).data as T;
    }
    return res as T;
  }
}
