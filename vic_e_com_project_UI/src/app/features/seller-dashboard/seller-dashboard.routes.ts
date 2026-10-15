import { Routes } from '@angular/router';

export const SELLER_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/seller-dashboard/seller-dashboard.component').then(
        (m) => m.SellerDashboardComponent
      ),
    title: 'Kênh người bán — VICMART SELLER',
  },
];
