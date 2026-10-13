import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AuthResponse {
  token: string;
  role: string;
  userId: number;
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

// Khai báo kiểu cho Google Identity Services SDK (load từ CDN)
declare const google: {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (response: { credential: string }) => void }) => void;
      prompt: () => void;
      renderButton: (parent: HTMLElement, options: object) => void;
    };
  };
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly API = 'http://localhost:9090/api/auth';

  // Client ID phải khớp với application.properties bên backend
  readonly GOOGLE_CLIENT_ID = '760753983454-o49qigi8rrhrbl68ji3a5dmrf5k65m5b.apps.googleusercontent.com';

  register(req: RegisterRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/register`, req).pipe(
      tap((res) => this.saveSession(res.data))
    );
  }

  login(req: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/login`, req).pipe(
      tap((res) => this.saveSession(res.data))
    );
  }

  /**
   * Gửi Google ID Token lên Backend để xác thực và nhận JWT
   */
  googleLogin(idToken: string): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.API}/google`, { idToken }).pipe(
      tap((res) => this.saveSession(res.data))
    );
  }

  /**
   * Khởi tạo Google Sign-In và xử lý kết quả qua callback
   */
  initGoogleSignIn(onSuccess: (idToken: string) => void): void {
    if (typeof google === 'undefined') {
      console.warn('Google GIS SDK chưa load xong, thử lại sau...');
      setTimeout(() => this.initGoogleSignIn(onSuccess), 500);
      return;
    }
    google.accounts.id.initialize({
      client_id: this.GOOGLE_CLIENT_ID,
      callback: (response) => onSuccess(response.credential),
    });
    google.accounts.id.prompt();
  }

  private saveSession(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('userId', String(data.userId));
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }
}
