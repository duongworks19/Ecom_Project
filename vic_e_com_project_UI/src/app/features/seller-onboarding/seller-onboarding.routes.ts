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
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'orders',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'orders' },
    title: 'Tất cả đơn hàng — VICMART SELLER',
  },
  {
    path: 'returns',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'returns' },
    title: 'Đổi trả / Hoàn tiền — VICMART SELLER',
  },
  {
    path: 'products',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'products' },
    title: 'Danh sách sản phẩm — VICMART SELLER',
  },
  {
    path: 'inventory',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'inv' },
    title: 'Kho hàng — VICMART SELLER',
  },
  { path: 'inv', redirectTo: 'inventory', pathMatch: 'full' },
  {
    path: 'vouchers',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'vouchers' },
    title: 'Voucher của shop — VICMART SELLER',
  },
  {
    path: 'campaigns',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'camps' },
    title: 'Chương trình giảm giá — VICMART SELLER',
  },
  { path: 'camps', redirectTo: 'campaigns', pathMatch: 'full' },
  {
    path: 'reviews',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'reviews' },
    title: 'Đánh giá khách hàng — VICMART SELLER',
  },
  {
    path: 'qa',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'qa' },
    title: 'Hỏi đáp khách hàng — VICMART SELLER',
  },
  {
    path: 'profile',
    canActivate: [sellerGatekeeperGuard],
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'profile' },
    title: 'Hồ sơ gian hàng — VICMART SELLER',
  },
  { path: 'dashboard/orders', redirectTo: 'orders', pathMatch: 'full' },
  { path: 'dashboard/returns', redirectTo: 'returns', pathMatch: 'full' },
  { path: 'dashboard/products', redirectTo: 'products', pathMatch: 'full' },
  { path: 'dashboard/inventory', redirectTo: 'inventory', pathMatch: 'full' },
  { path: 'dashboard/inv', redirectTo: 'inventory', pathMatch: 'full' },
  { path: 'dashboard/vouchers', redirectTo: 'vouchers', pathMatch: 'full' },
  { path: 'dashboard/campaigns', redirectTo: 'campaigns', pathMatch: 'full' },
  { path: 'dashboard/camps', redirectTo: 'campaigns', pathMatch: 'full' },
  { path: 'dashboard/reviews', redirectTo: 'reviews', pathMatch: 'full' },
  { path: 'dashboard/qa', redirectTo: 'qa', pathMatch: 'full' },
  { path: 'dashboard/profile', redirectTo: 'profile', pathMatch: 'full' },
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
