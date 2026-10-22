import { Routes } from '@angular/router';

export const SELLER_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    redirectTo: '/seller/dashboard',
    pathMatch: 'full',
  },
  {
    path: ':tab',
    redirectTo: '/seller/:tab',
  },
];
