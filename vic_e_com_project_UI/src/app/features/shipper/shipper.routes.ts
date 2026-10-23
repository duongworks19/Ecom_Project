import { Routes } from '@angular/router';
import { ShipperLayoutComponent } from './layouts/shipper-layout/shipper-layout.component';

export const SHIPPER_ROUTES: Routes = [
  {
    path: '',
    component: ShipperLayoutComponent,
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/shipper-dashboard.component').then((m) => m.ShipperDashboardComponent),
        title: 'Tổng quan giao nhận — VIC MART Shipper',
      },
      {
        path: 'pickup',
        loadComponent: () =>
          import('./pages/pickup/shipper-pickup.component').then((m) => m.ShipperPickupComponent),
        title: 'Đơn cần lấy từ Shop — VIC MART Shipper',
      },
      {
        path: 'delivering',
        loadComponent: () =>
          import('./pages/delivering/shipper-delivering.component').then((m) => m.ShipperDeliveringComponent),
        title: 'Đơn đang giao cho khách — VIC MART Shipper',
      },
      {
        path: 'history',
        loadComponent: () =>
          import('./pages/history/shipper-history.component').then((m) => m.ShipperHistoryComponent),
        title: 'Lịch sử giao hàng — VIC MART Shipper',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/shipper-profile.component').then((m) => m.ShipperProfileComponent),
        title: 'Hồ sơ cá nhân Shipper — VIC MART Shipper',
      },
    ],
  },
];
