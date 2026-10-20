import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { AuthComponent } from './features/auth/auth.component';
import { passwordChangeGuard } from './core/guards/password-change.guard';
import { adminGuard } from './core/guards/admin.guard';
import { customerAuthGuard } from './core/guards/customer-auth.guard';
import { CustomerLayoutComponent } from './layouts/customer-layout/customer-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    canActivate: [passwordChangeGuard],
    title: 'VIC MART — Khám Phá & Mua Sắm Mọi Thứ Trực Tuyến',
  },
  {
    path: 'login',
    component: AuthComponent,
    canActivate: [passwordChangeGuard],
    title: 'Đăng nhập — VIC MART',
  },
  {
    path: 'register',
    component: AuthComponent,
    canActivate: [passwordChangeGuard],
    title: 'Đăng ký tài khoản mới — VIC MART',
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./features/auth/change-password/change-password.component').then(
        (m) => m.ChangePasswordComponent
      ),
    title: 'Đổi mật khẩu lần đầu — VIC MART',
  },
  {
    path: 'admin',
    canActivate: [passwordChangeGuard, adminGuard],
    loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
  },
  {
    path: 'seller',
    loadChildren: () =>
      import('./features/seller-onboarding/seller-onboarding.routes').then(
        (m) => m.SELLER_ONBOARDING_ROUTES
      ),
  },
  {
    path: 'seller-center/dashboard',
    redirectTo: 'seller/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'shop',
    redirectTo: 'seller/shop',
    pathMatch: 'full',
  },
  {
    path: 'account',
    component: CustomerLayoutComponent,
    canActivate: [passwordChangeGuard, customerAuthGuard],
    loadChildren: () =>
      import('./features/account/account.routes').then((m) => m.ACCOUNT_ROUTES),
    title: 'Tài khoản của tôi — VIC MART',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
