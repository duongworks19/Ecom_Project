import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SellerOnboardingService } from '../services/seller-onboarding.service';

/**
 * Gatekeeping Guard:
 * Bảo vệ các trang Seller Center (UC75 - UC92)
 * Chỉ cho phép người dùng đã được Admin phê duyệt (status === 'APPROVED') truy cập.
 */
export const sellerGatekeeperGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const onboardingService = inject(SellerOnboardingService);
  const router = inject(Router);

  // 1. Kiểm tra đã đăng nhập chưa
  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }

  const role = authService.getRole();
  const status = onboardingService.currentStatus();

  // 2. Nếu đã là VENDOR và trạng thái APPROVED -> Cho phép truy cập
  if (role === 'VENDOR' || status === 'APPROVED') {
    return true;
  }

  // 3. Nếu chưa được duyệt -> Chặn và đưa về màn hình theo dõi trạng thái
  return router.createUrlTree(['/seller/status']);
};

/**
 * Onboarding Access Guard:
 * Yêu cầu đăng nhập trước khi vào Form Wizard đăng ký
 */
export const requireLoginForOnboardingGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: '/seller/register' },
    });
  }

  return true;
};
