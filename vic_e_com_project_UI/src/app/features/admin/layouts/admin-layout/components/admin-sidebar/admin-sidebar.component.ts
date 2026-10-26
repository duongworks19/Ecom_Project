import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavItem {
  label: string;
  route: string;
  exact?: boolean;
}

interface NavGroup {
  groupTitle: string;
  items: NavItem[];
}

@Component({
  selector: 'vic-admin-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.component.html',
  styleUrl: './admin-sidebar.component.scss',
})
export class AdminSidebarComponent {
  navGroups: NavGroup[] = [
    {
      groupTitle: 'TỔNG QUAN',
      items: [
        { label: 'Tổng quan', route: '/admin/dashboard', exact: true },
        { label: 'Báo cáo & xuất dữ liệu', route: '/admin/reports' },
      ],
    },
    {
      groupTitle: 'NGƯỜI DÙNG',
      items: [
        { label: 'Quản lý người dùng', route: '/admin/users' },
        { label: 'Duyệt vendor', route: '/admin/vendors' },
        { label: 'Quản lý shipper', route: '/admin/shippers' },
      ],
    },
    {
      groupTitle: 'DANH MỤC & SẢN PHẨM',
      items: [
        { label: 'Danh mục', route: '/admin/categories' },
      ],
    },
    {
      groupTitle: 'ĐƠN HÀNG & GIAO HÀNG',
      items: [
        { label: 'Đơn hàng', route: '/admin/orders' },
        { label: 'Gán shipper & vận đơn', route: '/admin/dispatch' },
      ],
    },
  ];
}
