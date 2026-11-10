import {
  SellerDashboardData,
  SellerNotification,
  SellerProduct,
  SellerPromotion,
  SellerReviewQuestion,
  SellerShopProfile,
  SellerVoucher,
} from '../models/seller-dashboard.model';

export const SELLER_PRODUCT_IMAGES: Record<string, string> = {};

export const PRESET_DECOR_IMAGES: { label: string; url: string; color: string }[] = [];

export const INITIAL_SELLER_PRODUCTS: SellerProduct[] = [];

export const INITIAL_SELLER_VOUCHERS: SellerVoucher[] = [];

export const INITIAL_SELLER_PROMOTIONS: SellerPromotion[] = [];

export const INITIAL_SELLER_REVIEWS: SellerReviewQuestion[] = [];

export const INITIAL_SELLER_NOTIFICATIONS: SellerNotification[] = [];

export const INITIAL_SHOP_PROFILE: SellerShopProfile = {
  shopName: '',
  tagline: '',
  description: '',
  phone: '',
  email: '',
  pickupAddress: '',
  businessHours: '08:00 – 21:00',
};

export function createDefaultSellerDashboardData(): SellerDashboardData {
  return {
    shopId: 0,
    shopName: '',
    shopAvatarLetter: 'S',
    adminApproved: true,
    greetingTitle: '',
    currentDateText: '',
    totalUrgentTasks: 0,
    unreadNotifications: 0,
    completedSteps: 0,
    totalSteps: 4,
    stats: {
      todayRevenue: 0,
      revenueGrowthPercent: 0,
      totalOrdersToday: 0,
      orderGrowthCount: 0,
      cancellationRate: 0,
      cancellationRateDiff: 0,
      averageRating: 0,
      totalReviews: 0,
    },
    todos: {
      pendingConfirmationOrders: 0,
      pendingPackagingOrders: 0,
      refundRequests: 0,
      lowStockAlerts: 0,
      unansweredQuestions: 0,
    },
    revenueChart7Days: [
      { label: 'T2', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
      { label: 'T3', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
      { label: 'T4', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
      { label: 'T5', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
      { label: 'T6', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
      { label: 'T7', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
      { label: 'CN', valueInMillions: 0, exactRevenue: 0, orderCount: 0 },
    ],
    revenueChart30Days: [],
    lowStockProducts: [],
    recentOrders: [],
    products: [],
  };
}
