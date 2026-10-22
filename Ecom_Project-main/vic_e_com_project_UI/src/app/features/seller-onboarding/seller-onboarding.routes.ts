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
    path: 'shop',
    loadComponent: () =>
      import('../seller-dashboard/pages/shop-storefront/shop-storefront.component').then(
        (m) => m.ShopStorefrontComponent
      ),
    title: 'Trang chủ gian hàng — VIC MART',
  },
  // Trang chủ Kênh người bán: /seller/dashboard
  {
    path: 'dashboard',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'overview' },
    title: 'Kênh người bán — VIC MART SELLER',
  },
  // Chuyển hướng các sub-tab nếu gõ /seller/dashboard/:tab sang /seller/:tab
  {
    path: 'dashboard/:tab',
    redirectTo: (route) => route.params['tab'] || 'dashboard',
  },
  {
    path: 'overview',
    redirectTo: 'dashboard',
    pathMatch: 'full',
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'orders' },
    title: 'Quản lý đơn hàng — VIC MART',
  },
  {
    path: 'returns',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'returns' },
    title: 'Đổi trả / Hoàn tiền — VIC MART',
  },
  {
    path: 'refunds',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'refunds' },
    title: 'Đổi trả / Hoàn tiền — VIC MART',
  },
  {
    path: 'products',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'products' },
    title: 'Danh sách sản phẩm — VIC MART',
  },
  {
    path: 'add-product',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'add-product' },
    title: 'Thêm sản phẩm mới — VIC MART',
  },
  {
    path: 'inventory',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'inventory' },
    title: 'Quản lý kho hàng — VIC MART',
  },
  {
    path: 'vouchers',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'vouchers' },
    title: 'Voucher của shop — VIC MART',
  },
  {
    path: 'promotions',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'promotions' },
    title: 'Chương trình khuyến mãi — VIC MART',
  },
  {
    path: 'reviews',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'reviews' },
    title: 'Đánh giá khách hàng — VIC MART',
  },
  {
    path: 'qa',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'qa' },
    title: 'Hỏi đáp sản phẩm — VIC MART',
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('../seller-dashboard/pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { tab: 'profile' },
    title: 'Hồ sơ gian hàng — VIC MART',
  },
];
