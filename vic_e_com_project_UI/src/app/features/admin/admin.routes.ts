import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { adminGuard } from '../../core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        title: 'Tổng quan Quản trị — VIC MART Admin',
      },
      {
        path: 'vendors',
        loadComponent: () =>
          import('./pages/vendor-approval/vendor-approval.page').then((m) => m.VendorApprovalPage),
        title: 'Duyệt vendor — VIC MART Admin',
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./pages/admin-reports/admin-reports.component').then((m) => m.AdminReportsComponent),
        title: 'Báo cáo & xuất dữ liệu — VIC MART Admin',
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.component').then((m) => m.AdminUsersComponent),
        title: 'Quản lý người dùng — VIC MART Admin',
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/pages/admin-category-page/admin-category-page.component').then(
            (m) => m.AdminCategoryPageComponent
          ),
        title: 'Quản lý danh mục — VIC MART Admin',
      },
      {
        path: 'shippers',
        loadComponent: () =>
          import('./pages/admin-shippers/admin-shippers.component').then(
            (m) => m.AdminShippersComponent
          ),
        title: 'Quản lý shipper — VIC MART Admin',
      },
      {
        path: 'shippers/new',
        loadComponent: () =>
          import('./pages/admin-shipper-form/admin-shipper-form.component').then(
            (m) => m.AdminShipperFormComponent
          ),
        title: 'Tạo tài khoản shipper — VIC MART Admin',
      },
      {
        path: 'shippers/:id/edit',
        loadComponent: () =>
          import('./pages/admin-shipper-form/admin-shipper-form.component').then(
            (m) => m.AdminShipperFormComponent
          ),
        title: 'Cập nhật shipper — VIC MART Admin',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin-orders/admin-orders.component').then(
            (m) => m.AdminOrdersComponent
          ),
        title: 'Đơn hàng — VIC MART Admin',
      },
      {
        path: 'dispatch',
        loadChildren: () =>
          import('./dispatch/dispatch.routes').then((m) => m.DISPATCH_ROUTES),
      },
      {
        path: 'shipments',
        redirectTo: 'dispatch',
        pathMatch: 'full',
      },
      {
        // ponytail: reuse customer ProfilePageComponent directly since it only renders the profile card (without AccountLayout sidebar)
        path: 'profile',
        loadComponent: () =>
          import('../account/profile/pages/profile-page/profile-page.component').then(
            (m) => m.ProfilePageComponent
          ),
        title: 'Hồ sơ của tôi — VIC MART Admin',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
