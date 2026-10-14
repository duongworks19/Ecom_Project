export type CustomerStatus = 'ACTIVE' | 'LOCKED';

export interface CustomerKpiCard {
  id: string;
  title: string;
  value: number;
  subtext: string;
  isDark?: boolean;
  subtextHighlight?: boolean;
}

export interface CustomerAddress {
  id: number;
  label: string;
  addressDetail: string;
  isDefault: boolean;
}

export interface CustomerPurchaseStats {
  totalOrders: number;
  cancelledOrders: number;
  totalSpent: string;
  lastOrderDate: string;
}

export interface AdminCustomer {
  id: number;
  code: string;
  fullName: string;
  initial: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  createdAt: string;
  addresses: CustomerAddress[];
  purchaseStats: CustomerPurchaseStats;
}

export interface CustomerStatusChangePayload {
  customerId: number;
  action: 'LOCK' | 'UNLOCK';
  reason: string;
}

export interface AdminUsersOverview {
  kpis: CustomerKpiCard[];
  totalCount: number;
  customers: AdminCustomer[];
}
