import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminDashboardApiResponse,
  AdminDashboardData,
  OrderStatusStat,
  DailyRevenue,
  RecentActivity,
} from '../models/admin-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDashboardData(limit = 10): Observable<AdminDashboardData> {
    return this.http
      .get<AdminDashboardApiResponse>(`${this.apiUrl}/admin/dashboard`, {
        params: { limit: limit.toString() },
      })
      .pipe(map((res) => this.mapResponse(res)));
  }

  getOrderStatusStats(): Observable<{ totalOrders: number; items: OrderStatusStat[] }> {
    return this.getDashboardData().pipe(map((data) => data.orderStatusStats));
  }

  getWeeklyRevenue(): Observable<DailyRevenue[]> {
    return this.getDashboardData().pipe(map((data) => data.weeklyRevenue));
  }

  getRecentActivities(limit = 10): Observable<RecentActivity[]> {
    return this.getDashboardData(limit).pipe(map((data) => data.recentActivities));
  }

  private mapResponse(res: AdminDashboardApiResponse): AdminDashboardData {
    const tasks = res.pendingTasks;
    const status = res.orderStatus;
    const revenueItems = res.revenueLast7Days ?? [];

    return {
      kpis: [
        {
          id: 'pending-vendors',
          title: 'Vendor chờ duyệt',
          value: tasks?.pendingVendors ?? 0,
          subtext: 'Cần duyệt ngay',
          isDark: true,
        },
        {
          id: 'ready-to-ship',
          title: 'Đơn chờ gán shipper',
          value: tasks?.ordersAwaitingShipper ?? 0,
          subtext: 'Vendor đã đóng gói xong',
          isDark: false,
        },
        {
          id: 'failed-deliveries',
          title: 'Giao thất bại chờ xử lý',
          value: tasks?.failedDeliveriesAwaitingDecision ?? 0,
          subtext: 'Chưa chọn hướng xử lý',
          isDark: false,
        },
        {
          id: 'pending-returns',
          title: 'Đổi trả chưa xử lý',
          value: tasks?.pendingReturns ?? 0,
          subtext: 'Đang chờ phản hồi',
          isDark: false,
        },
      ],
      orderStatusStats: {
        totalOrders: status?.total ?? 0,
        items: [
          { statusKey: 'PENDING_CONFIRM', label: 'Chờ xác nhận', count: status?.pending ?? 0, color: '#2f54eb' },
          { statusKey: 'PREPARING', label: 'Đang chuẩn bị', count: status?.preparing ?? 0, color: '#8c8c8c' },
          { statusKey: 'SHIPPING', label: 'Đang giao', count: status?.shipping ?? 0, color: '#722ed1' },
          { statusKey: 'DELIVERED', label: 'Đã giao', count: status?.delivered ?? 0, color: '#135200' },
          { statusKey: 'CANCELLED', label: 'Đã hủy', count: status?.cancelled ?? 0, color: '#e60023' },
        ],
      },
      weeklyRevenue: revenueItems.map((item, idx) => ({
        date: this.formatShortDate(item.date),
        amount: Math.round(((Number(item.amount) || 0) / 1_000_000) * 10) / 10,
        isCurrentDay: idx === revenueItems.length - 1,
      })),
      recentActivities: (res.recentActivities ?? []).map((act, idx) => ({
        id: `${act.type}-${act.referenceId}-${idx}`,
        type: this.mapActivityType(act.type),
        description: act.title,
        timeAgo: this.formatTimeAgo(act.occurredAt),
      })),
    };
  }

  private formatShortDate(isoDate: string): string {
    const parts = isoDate?.split('-');
    return parts?.length === 3 ? `${parts[2]}/${parts[1]}` : isoDate;
  }

  private mapActivityType(type: string): RecentActivity['type'] {
    switch (type) {
      case 'VENDOR':
        return 'Vendor';
      case 'ORDER':
        return 'Đơn hàng';
      case 'SHIPPING':
        return 'Giao hàng';
      case 'RETURN':
        return 'Đổi trả';
      default:
        return 'Đơn hàng';
    }
  }

  private formatTimeAgo(isoDateTime: string): string {
    if (!isoDateTime) return '';
    const time = new Date(isoDateTime).getTime();
    if (isNaN(time)) return isoDateTime;
    const diffMinutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
    if (diffMinutes < 1) return 'Vừa xong';
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${Math.floor(diffHours / 24)} ngày trước`;
  }
}
