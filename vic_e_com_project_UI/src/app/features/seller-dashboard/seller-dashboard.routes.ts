import { Routes } from '@angular/router';

export const SELLER_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'overview',
    pathMatch: 'full',
  },
  {
    path: 'overview',
    loadComponent: () =>
      import('./pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    data: { view: 'dash' },
    title: 'Tổng quan — VICMART SELLER',
  },
  {
    path: 'orders',
    redirectTo: '/seller/orders',
    pathMatch: 'full',
  },
  {
    path: 'returns',
    redirectTo: '/seller/returns',
    pathMatch: 'full',
  },
  {
    path: 'products',
    redirectTo: '/seller/products',
    pathMatch: 'full',
  },
  {
    path: 'inventory',
    redirectTo: '/seller/inventory',
    pathMatch: 'full',
  },
  {
    path: 'inv',
    redirectTo: '/seller/inventory',
    pathMatch: 'full',
  },
  {
    path: 'vouchers',
    redirectTo: '/seller/vouchers',
    pathMatch: 'full',
  },
  {
    path: 'campaigns',
    redirectTo: '/seller/campaigns',
    pathMatch: 'full',
  },
  {
    path: 'camps',
    redirectTo: '/seller/campaigns',
    pathMatch: 'full',
  },
  {
    path: 'reviews',
    redirectTo: '/seller/reviews',
    pathMatch: 'full',
  },
  {
    path: 'qa',
    redirectTo: '/seller/qa',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    redirectTo: '/seller/profile',
    pathMatch: 'full',
  },
];
