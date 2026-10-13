import { Routes } from '@angular/router';
import { LandingComponent } from './features/landing/landing.component';
import { AuthComponent } from './features/auth/auth.component';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    title: 'VIC MART — Khám Phá & Mua Sắm Mọi Thứ Trực Tuyến',
  },
  {
    path: 'login',
    component: AuthComponent,
    title: 'Đăng nhập — VIC MART',
  },
  {
    path: 'register',
    component: AuthComponent,
    title: 'Đăng ký tài khoản mới — VIC MART',
  },
  {
    path: '**',
    redirectTo: '',
  },
];
