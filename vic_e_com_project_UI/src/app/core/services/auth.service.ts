import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, delay, of, tap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  role: string;
  userId: number;
  fullName?: string;
  email?: string;
  mustChangePassword?: boolean;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

declare const google:
  | {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            use_fedcm_for_prompt?: boolean;
          }) => void;
          prompt: (momentListener?: (notification: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => void) => void;
          renderButton: (parent: HTMLElement, options: object) => void;
        };
      };
    }
  | undefined;

@Injectable({
  providedIn: 'root',
  useFactory: () => (environment.useMockApi ? new MockAuthService() : new HttpAuthService()),
})
export abstract class AuthService {
  readonly GOOGLE_CLIENT_ID = '760753983454-o49qigi8rrhrbl68ji3a5dmrf5k65m5b.apps.googleusercontent.com';
  readonly mustChangePasswordSignal = signal<boolean>(localStorage.getItem('mustChangePassword') === 'true');
  readonly isLoggedInSignal = signal<boolean>(this.hasValidToken());
  readonly currentRoleSignal = signal<string | null>(localStorage.getItem('role'));
  readonly currentUserNameSignal = signal<string | null>(
    localStorage.getItem('fullName') || localStorage.getItem('currentUsername')
  );

  abstract register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>>;
  abstract login(req: LoginRequest): Observable<ApiResponse<AuthResponse>>;
  abstract googleLogin(idToken: string): Observable<ApiResponse<AuthResponse>>;
  abstract changePassword(req: ChangePasswordRequest): Observable<ApiResponse<null>>;

  private hasValidToken(): boolean {
    const token = localStorage.getItem('token');
    return !!token && token !== 'undefined' && token !== 'null';
  }

  initGoogleSignIn(onSuccess: (idToken: string) => void, onCancel?: () => void): void {
    if (google === undefined) {
      setTimeout(() => this.initGoogleSignIn(onSuccess, onCancel), 500);
      return;
    }
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response) => onSuccess(response.credential),
      use_fedcm_for_prompt: false,
    });
    google.accounts.id.prompt((notification?: { isNotDisplayed?: () => boolean; isSkippedMoment?: () => boolean }) => {
      if (notification?.isNotDisplayed?.() || notification?.isSkippedMoment?.()) {
        onCancel?.();
      }
    });
  }

  renderGoogleButton(parent: HTMLElement, onSuccess: (idToken: string) => void): void {
    if (google === undefined) {
      setTimeout(() => this.renderGoogleButton(parent, onSuccess), 500);
      return;
    }
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response) => onSuccess(response.credential),
      use_fedcm_for_prompt: false,
    });
    parent.innerHTML = '';
    google.accounts.id.renderButton(parent, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: parent.clientWidth || 380,
      text: 'continue_with',
      shape: 'rectangular',
      locale: 'vi',
    });
  }

  protected saveSession(data: AuthResponse, fallbackUsername?: string): void {
    const resolvedToken = data.accessToken ?? data.token ?? '';
    const displayName = data.fullName || data.email || fallbackUsername || localStorage.getItem('currentUsername') || 'Thành viên';

    sessionStorage.removeItem('explicit_logout');
    localStorage.setItem('token', resolvedToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', String(data.userId));
    localStorage.setItem('fullName', displayName);
    if (data.email || fallbackUsername) {
      localStorage.setItem('currentUsername', (data.email || fallbackUsername)!);
    }

    this.isLoggedInSignal.set(!!resolvedToken);
    this.currentRoleSignal.set(data.role);
    this.currentUserNameSignal.set(displayName);
    this.setMustChangePassword(!!data.mustChangePassword);
  }

  setMustChangePassword(required: boolean): void {
    localStorage.setItem('mustChangePassword', String(required));
    this.mustChangePasswordSignal.set(required);
  }

  mustChangePassword(): boolean {
    return localStorage.getItem('mustChangePassword') === 'true';
  }

  logout(): void {
    sessionStorage.setItem('explicit_logout', '1');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('fullName');
    localStorage.removeItem('mustChangePassword');
    localStorage.removeItem('currentUsername');
    this.isLoggedInSignal.set(false);
    this.currentRoleSignal.set(null);
    this.currentUserNameSignal.set(null);
    this.mustChangePasswordSignal.set(false);
  }

  isLoggedIn(): boolean {
    return this.hasValidToken();
  }

  getToken(): string | null {
    return this.hasValidToken() ? localStorage.getItem('token') : null;
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}

@Injectable()
export class HttpAuthService extends AuthService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/auth`;

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/register`, req).pipe(
      tap((res) => this.saveSession(res.data, req.fullName || req.email))
    );
  }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/login`, req).pipe(
      tap((res) => this.saveSession(res.data, req.username))
    );
  }

  googleLogin(idToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/google`, { idToken }).pipe(
      tap((res) => this.saveSession(res.data))
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<null>> {
    // TODO: backend endpoint /api/auth/change-password chưa có; wiring sau khi backend implement.
    return this.http.post<ApiResponse<null>>(`${this.API}/change-password`, req).pipe(
      tap(() => this.setMustChangePassword(false))
    );
  }
}

@Injectable()
export class MockAuthService extends AuthService {
  private readonly latencyMs = 300;
  private readonly accounts = new Map<string, { password: string; role: string; userId: number; mustChangePassword: boolean; fullName?: string }>([
    ['admin@demo.local', { password: 'Admin@123', role: 'ADMIN', userId: 1, mustChangePassword: false, fullName: 'Quản trị viên' }],
    ['shipper@demo.local', { password: 'Shipper@123', role: 'SHIPPER', userId: 2, mustChangePassword: false, fullName: 'Nguyễn Minh Anh' }],
    ['shipper-first@demo.local', { password: 'Temp@12345', role: 'SHIPPER', userId: 3, mustChangePassword: true, fullName: 'Nguyễn Minh Anh' }],
  ]);

  constructor() {
    super();
  }

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    const email = req.email.trim().toLowerCase();
    this.accounts.set(email, { password: req.password, role: 'CUSTOMER', userId: Date.now(), mustChangePassword: false, fullName: req.fullName });
    const data: AuthResponse = { token: 'mock-jwt-customer', role: 'CUSTOMER', userId: 99, mustChangePassword: false, fullName: req.fullName };
    return of({ message: 'Đăng ký thành công', data }).pipe(
      delay(this.latencyMs),
      tap((res) => {
        localStorage.setItem('currentUsername', email);
        this.saveSession(res.data);
      })
    );
  }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    const key = req.username.trim().toLowerCase();
    const acc = this.accounts.get(key);
    if (!acc || acc.password !== req.password) {
      return throwError(
        () => new HttpErrorResponse({ status: 401, error: { message: 'Email hoặc mật khẩu không đúng' } })
      );
    }
    const data: AuthResponse = {
      token: `mock-jwt-${acc.role.toLowerCase()}`,
      role: acc.role,
      userId: acc.userId,
      fullName: acc.fullName,
      mustChangePassword: acc.mustChangePassword,
    };
    return of({ message: 'Đăng nhập thành công', data }).pipe(
      delay(this.latencyMs),
      tap((res) => {
        localStorage.setItem('currentUsername', key);
        this.saveSession(res.data);
      })
    );
  }

  googleLogin(): Observable<ApiResponse<AuthResponse>> {
    const data: AuthResponse = { token: 'mock-jwt-google', role: 'CUSTOMER', userId: 100, mustChangePassword: false };
    return of({ message: 'Đăng nhập Google thành công', data }).pipe(
      delay(this.latencyMs),
      tap((res) => this.saveSession(res.data))
    );
  }

  changePassword(req: ChangePasswordRequest): Observable<ApiResponse<null>> {
    // TODO: backend endpoint /api/auth/change-password chưa có; wiring sau khi backend implement.
    const username = localStorage.getItem('currentUsername') ?? 'shipper@demo.local';
    const acc = this.accounts.get(username);
    if (acc && acc.password !== req.currentPassword) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { field: 'currentPassword', message: 'Mật khẩu hiện tại không chính xác' },
          })
      );
    }
    if (acc) {
      acc.password = req.newPassword;
      acc.mustChangePassword = false;
    }
    return of({ message: 'Đổi mật khẩu thành công', data: null }).pipe(
      delay(this.latencyMs),
      tap(() => this.setMustChangePassword(false))
    );
  }
}
