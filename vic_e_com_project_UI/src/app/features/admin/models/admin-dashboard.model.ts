export interface KpiCard {
  id: string;
  title: string;
  value: number | string;
  subtext: string;
  isDark?: boolean;
}

export interface OrderStatusStat {
  statusKey: string;
  label: string;
  count: number;
  color: string;
}

export interface DailyRevenue {
  date: string; // e.g. "07/10"
  amount: number; // e.g. 12.4
  isCurrentDay?: boolean;
}

export interface RecentActivity {
  id: string;
  type: 'Vendor' | 'Đơn hàng' | 'Giao hàng' | 'Đổi trả';
  description: string;
  timeAgo: string;
}

export interface AdminDashboardData {
  kpis: KpiCard[];
  orderStatusStats: {
    totalOrders: number;
    items: OrderStatusStat[];
  };
  weeklyRevenue: DailyRevenue[];
  recentActivities: RecentActivity[];
}
