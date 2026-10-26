export type CustomerStatus = 'ACTIVE' | 'LOCKED' | 'PENDING';
export type UserRole = 'ADMIN' | 'CUSTOMER' | 'VENDOR' | 'SHIPPER';

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
  avatarUrl?: string | null;
  email: string;
  phone: string;
  status: CustomerStatus;
  role: UserRole;
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
  page: number;
  size: number;
  totalPages: number;
  customers: AdminCustomer[];
}

export interface CustomerPageApiResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface CustomerListItemApiResponse {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl: string | null;
  status: CustomerStatus;
  createdAt: string;
  role: UserRole;
}

export interface CustomerSummaryApiResponse {
  total: number;
  active: number;
  locked: number;
  newLast7Days: number;
}

export interface CustomerDetailApiResponse {
  profile: CustomerListItemApiResponse;
  addresses: {
    id: number;
    receiverName: string;
    phone: string;
    addressDetail: string;
    isDefault: boolean;
  }[];
  purchaseSummary: {
    totalOrders: number;
    cancelledOrders: number;
    totalSpent: number;
    lastOrderAt: string | null;
  };
}

export interface CustomerOrderItemApiResponse {
  id: number;
  orderCode: string;
  status: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  shippingStatus: string | null;
  totalAmount: number;
  createdAt: string;
}

export interface CustomerReviewItemApiResponse {
  id: number;
  productId: number;
  productName: string;
  orderCode: string;
  rating: number;
  comment: string | null;
  media: {
    url: string;
    type: 'IMAGE' | 'VIDEO';
  }[];
  vendorReply: {
    content: string;
    createdAt: string;
  } | null;
  createdAt: string;
}

export interface CustomerStatusApiResponse {
  id: number;
  status: CustomerStatus;
}

