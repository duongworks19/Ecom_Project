import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { passwordChangeGuard } from './password-change.guard';
import { adminGuard } from './admin.guard';
import { passwordChangeInterceptor } from '../interceptors/password-change.interceptor';

describe('Auth Guards & Password Change Interceptor', () => {
  let authService: AuthService;
  let router: Router;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([passwordChangeInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    authService = TestBed.inject(AuthService);
    router = TestBed.inject(Router);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  it('passwordChangeGuard redirects to /change-password when mustChangePassword is true', () => {
    authService.setMustChangePassword(true);
    const result = TestBed.runInInjectionContext(() =>
      passwordChangeGuard({} as ActivatedRouteSnapshot, { url: '/admin/shippers' } as RouterStateSnapshot)
    );
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/change-password');
  });

  it('adminGuard allows ADMIN when mustChangePassword is false and blocks non-admin', () => {
    localStorage.setItem('token', 'test-jwt-admin');
    localStorage.setItem('role', 'ADMIN');
    authService.setMustChangePassword(false);
    const allowed = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin/shippers' } as RouterStateSnapshot)
    );
    expect(allowed).toBe(true);

    authService.logout();
    const blocked = TestBed.runInInjectionContext(() =>
      adminGuard({} as ActivatedRouteSnapshot, { url: '/admin/shippers' } as RouterStateSnapshot)
    );
    expect((blocked as UrlTree).toString()).toBe('/login');
  });

  it('passwordChangeInterceptor catches 403 PASSWORD_CHANGE_REQUIRED and navigates to /change-password', async () => {
    const navSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    authService.setMustChangePassword(false);

    const reqPromise = firstValueFrom(httpClient.get('/api/v1/admin/shippers')).catch(
      (e: HttpErrorResponse) => e
    );

    const req = httpMock.expectOne('/api/v1/admin/shippers');
    req.flush(
      { code: 'PASSWORD_CHANGE_REQUIRED', message: 'Bắt buộc đổi mật khẩu' },
      { status: 403, statusText: 'Forbidden' }
    );

    const err = await reqPromise;
    expect((err as HttpErrorResponse).status).toBe(403);
    expect(authService.mustChangePassword()).toBe(true);
    expect(navSpy).toHaveBeenCalledWith('/change-password');
  });
});
