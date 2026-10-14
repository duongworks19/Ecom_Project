import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminDashboardData,
  OrderStatusStat,
  DailyRevenue,
  RecentActivity,
} from '../models/admin-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private http = inject(HttpClient, { optional: true });
  private apiUrl = environment.apiUrl;

  // Mock data mô phỏng đúng chuẩn số liệu theo thiết kế mẫu
  private mockDashboardData: AdminDashboardData = {
    kpis: [
      {
        id: 'pending-vendors',
        title: 'Vendor chờ duyệt',
        value: 5,
        subtext: 'Cần duyệt ngay',
        isDark: true,
      },
      {
        id: 'ready-to-ship',
        title: 'Đơn chờ gán shipper',
        value: 12,
        subtext: 'Vendor đã đóng gói xong',
        isDark: false,
      },
      {
        id: 'failed-deliveries',
        title: 'Giao thất bại chờ xử lý',
        value: 3,
        subtext: 'Chưa chọn hướng xử lý',
        isDark: false,
      },
      {
        id: 'pending-returns',
        title: 'Đổi trả chưa xử lý',
        value: 4,
        subtext: 'Đang chờ phản hồi',
        isDark: false,
      },
    ],
    orderStatusStats: {
      totalOrders: 206,
      items: [
        { statusKey: 'PENDING_CONFIRM', label: 'Chờ xác nhận', count: 18, color: '#2f54eb' },
        { statusKey: 'PREPARING', label: 'Đang chuẩn bị', count: 22, color: '#8c8c8c' },
        { statusKey: 'SHIPPING', label: 'Đang giao', count: 31, color: '#722ed1' },
        { statusKey: 'DELIVERED', label: 'Đã giao', count: 126, color: '#135200' },
        { statusKey: 'CANCELLED', label: 'Đã hủy', count: 9, color: '#e60023' },
      ],
    },
    weeklyRevenue: [
      { date: '07/10', amount: 12.4, isCurrentDay: false },
      { date: '08/10', amount: 15.1, isCurrentDay: false },
      { date: '09/10', amount: 9.6, isCurrentDay: false },
      { date: '10/10', amount: 18.2, isCurrentDay: false },
      { date: '11/10', amount: 14.0, isCurrentDay: false },
      { date: '12/10', amount: 16.5, isCurrentDay: false },
      { date: '13/10', amount: 11.2, isCurrentDay: true },
    ],
    recentActivities: [
      {
        id: 'act-1',
        type: 'Vendor',
        description: 'Vendor mới đăng ký gian hàng, chờ duyệt',
        timeAgo: '10 phút trước',
      },
      {
        id: 'act-2',
        type: 'Đơn hàng',
        description: 'Đơn đã đóng gói, chờ gán shipper',
        timeAgo: '32 phút trước',
      },
      {
        id: 'act-3',
        type: 'Giao hàng',
        description: 'Shipper báo giao thất bại, chờ quyết định',
        timeAgo: '1 giờ trước',
      },
      {
        id: 'act-4',
        type: 'Đổi trả',
        description: 'Khách gửi yêu cầu đổi trả sản phẩm',
        timeAgo: '2 giờ trước',
      },
    ],
  };

  /**
   * Lấy toàn bộ số liệu thống kê Dashboard Admin
   * API quy ước: GET /api/v1/admin/dashboard/overview
   */
  getDashboardData(): Observable<AdminDashboardData> {
    /* 
     * Endpoint Backend thực tế:
     * return this.http.get<AdminDashboardData>(`${this.apiUrl}/v1/admin/dashboard/overview`);
     */
    return of(this.mockDashboardData);
  }

  /**
   * Lấy danh sách thống kê trạng thái đơn hàng
   * API quy ước: GET /api/v1/admin/orders/status-breakdown
   */
  getOrderStatusStats(): Observable<{ totalOrders: number; items: OrderStatusStat[] }> {
    /*
     * Endpoint Backend thực tế:
     * return this.http.get<any>(`${this.apiUrl}/v1/admin/orders/status-breakdown`);
     */
    return of(this.mockDashboardData.orderStatusStats).pipe(delay(150));
  }

  /**
   * Lấy doanh thu 7 ngày gần nhất
   * API quy ước: GET /api/v1/admin/revenue/last-7-days
   */
  getWeeklyRevenue(): Observable<DailyRevenue[]> {
    /*
     * Endpoint Backend thực tế:
     * return this.http.get<any>(`${this.apiUrl}/v1/admin/revenue/last-7-days`);
     */
    return of(this.mockDashboardData.weeklyRevenue).pipe(delay(150));
  }

  /**
   * Lấy các hoạt động gần đây
   * API quy ước: GET /api/v1/admin/activities/recent
   */
  getRecentActivities(): Observable<RecentActivity[]> {
    /*
     * Endpoint Backend thực tế:
     * return this.http.get<any>(`${this.apiUrl}/v1/admin/activities/recent`);
     */
    return of(this.mockDashboardData.recentActivities).pipe(delay(150));
  }
}
