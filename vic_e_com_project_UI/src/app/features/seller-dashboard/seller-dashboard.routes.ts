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
        title: 'Tá»•ng quan â€” VICMART SELLER',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/seller-orders/seller-orders.component').then(
            (m) => m.SellerOrdersComponent
          ),
        title: 'Táº¥t cáº£ Ä‘Æ¡n hĂ ng â€” VICMART SELLER',
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./pages/seller-returns/seller-returns.component').then(
            (m) => m.SellerReturnsComponent
          ),
        title: 'Äá»•i tráº£ / HoĂ n tiá»n â€” VICMART SELLER',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/seller-products/seller-products.component').then(
            (m) => m.SellerProductsComponent
          ),
        title: 'Danh sĂ¡ch sáº£n pháº©m â€” VICMART SELLER',
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/seller-inventory/seller-inventory.component').then(
            (m) => m.SellerInventoryComponent
          ),
        title: 'Kho hĂ ng â€” VICMART SELLER',
      },
      { path: 'inv', redirectTo: 'inventory', pathMatch: 'full' },
      {
        path: 'vouchers',
        loadComponent: () =>
          import('./pages/seller-vouchers/seller-vouchers.component').then(
            (m) => m.SellerVouchersComponent
          ),
        title: 'Voucher cá»§a shop â€” VICMART SELLER',
      },
      {
        path: 'campaigns',
        loadComponent: () =>
          import('./pages/seller-campaigns/seller-campaigns.component').then(
            (m) => m.SellerCampaignsComponent
          ),
        title: 'ChÆ°Æ¡ng trĂ¬nh giáº£m giĂ¡ â€” VICMART SELLER',
      },
      { path: 'camps', redirectTo: 'campaigns', pathMatch: 'full' },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./pages/seller-reviews/seller-reviews.component').then(
            (m) => m.SellerReviewsComponent
          ),
        title: 'ÄĂ¡nh giĂ¡ khĂ¡ch hĂ ng â€” VICMART SELLER',
      },
      {
        path: 'qa',
        loadComponent: () =>
          import('./pages/seller-qa/seller-qa.component').then(
            (m) => m.SellerQaComponent
          ),
        title: 'Há»i Ä‘Ă¡p khĂ¡ch hĂ ng â€” VICMART SELLER',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/seller-profile/seller-profile.component').then(
            (m) => m.SellerProfileComponent
          ),
        title: 'Há»“ sÆ¡ gian hĂ ng â€” VICMART SELLER',
      },
    ],
  },
];
