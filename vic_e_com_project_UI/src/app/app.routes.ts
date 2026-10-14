import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { AuthComponent } from './features/auth/auth.component';
import { passwordChangeGuard } from './core/guards/password-change.guard';
import { adminGuard } from './core/guards/admin.guard';

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
    path: '**',
    redirectTo: '',
  },
];
