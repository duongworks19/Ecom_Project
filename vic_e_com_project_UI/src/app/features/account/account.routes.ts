import { Routes } from '@angular/router';
import { AccountLayoutComponent } from './layout/account-layout.component';

export const ACCOUNT_ROUTES: Routes = [
  {
    path: '',
    component: AccountLayoutComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'profile',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent
          ),
      },
      {
        path: 'addresses',
        loadComponent: () =>
          import('./addresses/pages/addresses-page/addresses-page.component').then(
            (m) => m.AddressesPageComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/pages/orders-page/orders-page.component').then(
            (m) => m.OrdersPageComponent
          ),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import(
            './orders/pages/order-detail-placeholder-page/order-detail-placeholder-page.component'
          ).then((m) => m.OrderDetailPlaceholderPageComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('../wishlist/pages/wishlist-page/wishlist-page.component').then(
            (m) => m.WishlistPageComponent
          ),
        title: 'Sản phẩm yêu thích — VIC MART',
      },
    ],
  },
];
