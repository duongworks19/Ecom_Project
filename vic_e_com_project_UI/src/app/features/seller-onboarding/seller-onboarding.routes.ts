import { Routes } from '@angular/router';
import { SellerLandingComponent } from './pages/seller-landing/seller-landing.component';
import { SellerWizardComponent } from './pages/seller-wizard/seller-wizard.component';
import { SellerStatusComponent } from './pages/seller-status/seller-status.component';

import {
  sellerGatekeeperGuard,
  requireLoginForOnboardingGuard,
} from './guards/seller-gatekeeper.guard';

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
    canActivate: [requireLoginForOnboardingGuard],
    component: SellerWizardComponent,
    title: 'Đăng ký gian hàng mới — VIC MART',
  },
  {
    path: 'status',
    canActivate: [requireLoginForOnboardingGuard],
    component: SellerStatusComponent,
    title: 'Trạng thái hồ sơ người bán — VIC MART',
  },
  {
    path: 'revision',
    canActivate: [requireLoginForOnboardingGuard],
    loadComponent: () =>
      import('./pages/seller-revision/seller-revision.component').then(
        (m) => m.SellerRevisionComponent
      ),
    title: 'Bổ sung thông tin hồ sơ — VIC MART',
  },
  {
    path: 'dashboard',
    canActivate: [sellerGatekeeperGuard],
    loadChildren: () =>
      import('../seller-dashboard/seller-dashboard.routes').then(
        (m) => m.SELLER_DASHBOARD_ROUTES
      ),
  },
  {
    path: 'overview',
    redirectTo: 'dashboard/overview',
    pathMatch: 'full',
  },
  {
    path: 'orders',
    redirectTo: 'dashboard/orders',
    pathMatch: 'full',
  },
  {
    path: 'returns',
    redirectTo: 'dashboard/returns',
    pathMatch: 'full',
  },
  {
    path: 'products',
    redirectTo: 'dashboard/products',
    pathMatch: 'full',
  },
  {
    path: 'inventory',
    redirectTo: 'dashboard/inventory',
    pathMatch: 'full',
  },
  { path: 'inv', redirectTo: 'dashboard/inventory', pathMatch: 'full' },
  {
    path: 'vouchers',
    redirectTo: 'dashboard/vouchers',
    pathMatch: 'full',
  },
  {
    path: 'campaigns',
    redirectTo: 'dashboard/campaigns',
    pathMatch: 'full',
  },
  { path: 'camps', redirectTo: 'dashboard/campaigns', pathMatch: 'full' },
  {
    path: 'reviews',
    redirectTo: 'dashboard/reviews',
    pathMatch: 'full',
  },
  {
    path: 'qa',
    redirectTo: 'dashboard/qa',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    redirectTo: 'dashboard/profile',
    pathMatch: 'full',
  },
  {
    path: 'shop/:id',
    loadComponent: () =>
      import('../seller-dashboard/pages/shop-storefront/shop-storefront.component').then(
        (m) => m.ShopStorefrontComponent
      ),
    title: 'Trang chủ gian hàng — VIC MART',
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
