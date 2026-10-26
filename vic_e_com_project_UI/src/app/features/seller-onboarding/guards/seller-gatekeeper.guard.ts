import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/**
 * Gatekeeping Guard:
 * Bảo vệ các trang Seller Center (UC75 - UC92)
 * Chỉ cho phép người dùng đã được Admin phê duyệt (status === 'APPROVED' / role === 'VENDOR') truy cập.
 * Tài khoản Quản trị viên (ADMIN) không có quyền truy cập Kênh người bán (trang dành riêng cho vendor).
 */
export const sellerGatekeeperGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  // 1. Kiểm tra đã đăng nhập chưa
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const role = authService.getRole()?.toUpperCase();

  // 2. Chặn tài khoản Quản trị viên (ADMIN / ROLE_ADMIN)
  if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
    toastService.error('Tài khoản Quản trị viên không có quyền truy cập Kênh người bán.');
    return router.createUrlTree(['/admin']);
  }

  // 3. Chỉ Vendor đã được duyệt mới được vào Seller Center
  if (role === 'VENDOR' || role === 'ROLE_VENDOR') {
    return true;
  }

  // 4. Nếu chưa được duyệt -> Chặn và đưa về màn hình theo dõi trạng thái
  return router.createUrlTree(['/seller/status']);
};

/**
 * Onboarding Access Guard:
 * Yêu cầu đăng nhập trước khi vào Form Wizard đăng ký
 * Chặn tài khoản ADMIN mở gian hàng
 */
export const requireLoginForOnboardingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: '/seller/register' },
    });
  }

  const role = authService.getRole()?.toUpperCase();
  if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
    toastService.info('Tài khoản Quản trị viên không thể đăng ký mở gian hàng.');
    return router.createUrlTree(['/admin']);
  }

  return true;
};
