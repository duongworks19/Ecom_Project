import { Routes } from '@angular/router';
import { SellerLandingComponent } from './pages/seller-landing/seller-landing.component';
import { SellerWizardComponent } from './pages/seller-wizard/seller-wizard.component';
import { SellerStatusComponent } from './pages/seller-status/seller-status.component';

export const SELLER_ONBOARDING_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'onboarding',
    pathMatch: 'full',
  },
  {
    path: 'onboarding',
    component: SellerLandingComponent,
    title: 'Bán hàng cùng VIC MART — 0đ Phí khởi tạo',
  },
  {
    path: 'register',
    component: SellerWizardComponent,
    title: 'Đăng ký gian hàng mới — VIC MART',
  },
  {
    path: 'status',
    component: SellerStatusComponent,
    title: 'Trạng thái hồ sơ người bán — VIC MART',
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('../seller-dashboard/seller-dashboard.routes').then(
        (m) => m.SELLER_DASHBOARD_ROUTES
      ),
  },
  {
    path: 'shop',
    loadComponent: () =>
      import('../seller-dashboard/pages/shop-storefront/shop-storefront.component').then(
        (m) => m.ShopStorefrontComponent
      ),
    title: 'Trang chủ gian hàng — VIC MART',
  },
];
