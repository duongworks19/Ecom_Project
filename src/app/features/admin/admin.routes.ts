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
        path: 'vendors',
        loadComponent: () =>
          import('./pages/admin-vendors/admin-vendors.component').then((m) => m.AdminVendorsComponent),
        title: 'Xét duyệt & Quản lý vendor — VIC MART Admin',
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
        path: 'categories',
        loadComponent: () =>
          import('./pages/admin-categories/admin-categories.component').then(
            (m) => m.AdminCategoriesComponent
          ),
        title: 'Danh mục & Thương hiệu — VIC MART Admin',
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/admin-products/admin-products.component').then(
            (m) => m.AdminProductsComponent
          ),
        title: 'Sản phẩm toàn sàn — VIC MART Admin',
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/admin-orders/admin-orders.component').then(
            (m) => m.AdminOrdersComponent
          ),
        title: 'Quản lý đơn hàng — VIC MART Admin',
      },
      {
        path: 'shipments',
        loadComponent: () =>
          import('./pages/admin-shipments/admin-shipments.component').then(
            (m) => m.AdminShipmentsComponent
          ),
        title: 'Gán shipper & vận đơn — VIC MART Admin',
      },
      {
        path: 'vouchers',
        loadComponent: () =>
          import('./pages/admin-vouchers/admin-vouchers.component').then(
            (m) => m.AdminVouchersComponent
          ),
        title: 'Voucher toàn sàn — VIC MART Admin',
      },
      {
        path: 'returns',
        loadComponent: () =>
          import('./pages/admin-returns/admin-returns.component').then(
            (m) => m.AdminReturnsComponent
          ),
        title: 'Đổi trả & khiếu nại — VIC MART Admin',
      },
      {
        path: '**',
        redirectTo: 'dashboard',
      },
    ],
  },
];
