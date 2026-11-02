import { Routes } from '@angular/router';
import { SellerDashboardComponent } from './pages/seller-dashboard/seller-dashboard.component';

export const SELLER_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    component: SellerDashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'overview',
        pathMatch: 'full',
      },
      {
        path: 'overview',
        loadComponent: () =>
          import('./pages/seller-overview/seller-overview.component').then(
            (m) => m.SellerOverviewComponent
          ),
        title: 'Tổng quan — VICMART SELLER',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/seller-orders/seller-orders.component').then(
            (m) => m.SellerOrdersComponent
          ),
        title: 'Tất cả đơn hàng — VICMART SELLER',
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./pages/seller-returns/seller-returns.component').then(
            (m) => m.SellerReturnsComponent
          ),
        title: 'Đổi trả / Hoàn tiền — VICMART SELLER',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/seller-products/seller-products.component').then(
            (m) => m.SellerProductsComponent
          ),
        title: 'Danh sách sản phẩm — VICMART SELLER',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/seller-inventory/seller-inventory.component').then(
            (m) => m.SellerInventoryComponent
          ),
        title: 'Kho hàng — VICMART SELLER',
      },
      { path: 'inv', redirectTo: 'inventory', pathMatch: 'full' },
      {
        path: 'vouchers',
        loadComponent: () =>
          import('./pages/seller-vouchers/seller-vouchers.component').then(
            (m) => m.SellerVouchersComponent
          ),
        title: 'Voucher của shop — VICMART SELLER',
      },
      {
        path: 'campaigns',
        loadComponent: () =>
          import('./pages/seller-campaigns/seller-campaigns.component').then(
            (m) => m.SellerCampaignsComponent
          ),
        title: 'Chương trình giảm giá — VICMART SELLER',
      },
      { path: 'camps', redirectTo: 'campaigns', pathMatch: 'full' },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/seller-reviews/seller-reviews.component').then(
            (m) => m.SellerReviewsComponent
          ),
        title: 'Đánh giá khách hàng — VICMART SELLER',
      },
      {
        path: 'qa',
        loadComponent: () =>
          import('./pages/seller-qa/seller-qa.component').then(
            (m) => m.SellerQaComponent
          ),
        title: 'Hỏi đáp khách hàng — VICMART SELLER',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/seller-profile/seller-profile.component').then(
            (m) => m.SellerProfileComponent
          ),
        title: 'Hồ sơ gian hàng — VICMART SELLER',
      },
    ],
  },
];
