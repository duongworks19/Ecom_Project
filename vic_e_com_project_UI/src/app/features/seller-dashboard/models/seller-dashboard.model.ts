export type SellerNavTab =
  | 'overview'
  | 'orders'
  | 'refunds'
  | 'returns'
  | 'qa'
  | 'products'
  | 'add-product'
  | 'inventory'
  | 'vouchers'
  | 'promotions'
  | 'reviews'
  | 'profile';

export type VendorState = 'PENDING' | 'RESUBMITTED' | 'NEED_INFO' | 'REJECTED' | 'LOCKED';

export interface SellerReturnRequest {
  id: number;
  orderCode: string;
  type: string;
  customerName: string;
  reason: string;
  evidenceImagesCount: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
}

export interface SellerQaQuestion {
  id: number;
  productName: string;
  customerName: string;
  question: string;
  answer?: string;
}

export type OrderFilterType =
  | 'ALL'
  | 'PENDING_CONFIRMATION'
  | 'PREPARING'
  | 'PACKED'
  | 'REFUND';

export interface SellerDashboardStats {
  todayRevenue: number;
  revenueGrowthPercent: number;
  totalOrdersToday: number;
  orderGrowthCount: number;
  cancellationRate: number;
  cancellationRateDiff: number;
  averageRating: number;
  totalReviews: number;
}

export interface SellerTodo {
  pendingConfirmationOrders: number;
  pendingPackagingOrders: number;
  refundRequests: number;
  lowStockAlerts: number;
  unansweredQuestions: number;
}

export interface RevenuePoint {
  label: string;
  valueInMillions: number;
  exactRevenue: number;
  orderCount: number;
}

export interface ChartPointSvg {
  x: number;
  y: number;
  label: string;
  value: number;
  exactRevenue: number;
  orderCount: number;
}

export interface LowStockProduct {
  id: number;
  name: string;
  variant: string;
  sku: string;
  remainingQuantity: number;
  thumbnailColor: string;
  imageUrl?: string;
  badgeType: 'danger' | 'warning';
}

export interface SellerProductMediaItem {
  id?: number;
  url: string;
  type: 'IMAGE' | 'VIDEO' | string;
  sortOrder?: number;
}

export interface SellerProduct {
  id: number;
  name: string;
  variant: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  soldCount: number;
  thumbnailColor: string;
  imageUrl: string;
  media?: SellerProductMediaItem[];
  status: 'ACTIVE' | 'LOW_STOCK' | 'HIDDEN';
}

export interface SellerRecentOrder {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone?: string;
  shippingAddress?: string;
  createdAt?: string;
  productSummary: string;
  productImage?: string;
  totalAmount: number;
  status:
    | 'PENDING_CONFIRMATION'
    | 'PREPARING'
    | 'REFUND_REQUEST'
    | 'PACKED'
    | 'IN_REVIEW'
    | 'COMPLETED';
  statusLabel: string;
  badgeClass: 'w' | 'o' | 'r';
  actionText: string;
  actionStyle: 'red' | 'outline';
  nextAction:
    | 'CONFIRM'
    | 'MARK_PACKED'
    | 'REVIEW_REFUND'
    | 'APPROVE_REFUND'
    | 'VIEW_DETAIL';
}

export interface SellerVoucher {
  id: number;
  code: string;
  title?: string;
  discountText?: string;
  discountType?: 'PERCENT' | 'FIXED';
  value?: number;
  maxDiscount?: number;
  minOrderAmount: number;
  usedCount: number;
  totalQuota?: number;
  usageLimit?: number;
  expiryDate?: string;
  startAt?: string;
  endAt?: string;
  status?: string;
  displayStatus?: string;
  active?: boolean;
}

export interface SellerPromotion {
  id: number;
  name: string;
  discountPercent: number;
  productCount: number;
  timeRange: string;
  status: 'RUNNING' | 'UPCOMING';
}

export interface SellerReviewQuestion {
  id: number;
  customerName: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  createdAt: string;
  reply?: string;
}

export interface SellerNotification {
  id: number;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  targetNav: SellerNavTab;
}

export interface SellerShopProfile {
  shopName: string;
  tagline: string;
  description: string;
  phone: string;
  email: string;
  pickupAddress: string;
  warehouseAddress?: string;
  businessHours: string;
}

export interface SellerDashboardData {
  shopId: number;
  shopName: string;
  shopAvatarLetter: string;
  shopLogo?: string;
  adminApproved: boolean;
  greetingTitle: string;
  currentDateText: string;
  totalUrgentTasks: number;
  unreadNotifications: number;
  completedSteps: number;
  totalSteps: number;
  stats: SellerDashboardStats;
  todos: SellerTodo;
  revenueChart7Days: RevenuePoint[];
  revenueChart30Days: RevenuePoint[];
  lowStockProducts: LowStockProduct[];
  recentOrders: SellerRecentOrder[];
  products?: SellerProduct[];
  vouchers?: SellerVoucher[];
  promotions?: SellerPromotion[];
  reviews?: SellerReviewQuestion[];
  shopProfile?: SellerShopProfile;
}
