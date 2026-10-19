import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { customerAuthGuard } from './customer-auth.guard';

describe('customerAuthGuard', () => {
  let authService: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient()],
    });
    authService = TestBed.inject(AuthService);
  });

  it('allows access when logged in and mustChangePassword is false', () => {
    localStorage.setItem('token', 'valid-jwt');
    authService.setMustChangePassword(false);

    const res = TestBed.runInInjectionContext(() =>
      customerAuthGuard({} as ActivatedRouteSnapshot, { url: '/account/profile' } as RouterStateSnapshot)
    );
    expect(res).toBe(true);
  });

  it('redirects to /login when not logged in', () => {
    authService.logout();
    const res = TestBed.runInInjectionContext(() =>
      customerAuthGuard({} as ActivatedRouteSnapshot, { url: '/account/orders' } as RouterStateSnapshot)
    );
    expect(res instanceof UrlTree).toBe(true);
    expect((res as UrlTree).toString()).toContain('/login');
  });
});
