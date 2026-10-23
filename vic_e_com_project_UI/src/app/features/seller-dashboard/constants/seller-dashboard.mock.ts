import {
  SellerDashboardData,
  SellerNotification,
  SellerProduct,
  SellerPromotion,
  SellerReviewQuestion,
  SellerShopProfile,
  SellerVoucher,
} from '../models/seller-dashboard.model';

export const SELLER_PRODUCT_IMAGES: Record<string, string> = {
  'LM-021':
    'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
  'LM-044':
    'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=300&q=80',
  'LM-007':
    'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=300&q=80',
  'LM-063':
    'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=300&q=80',
  'LM-088':
    'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=300&q=80',
  'LM-052':
    'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=300&q=80',
  'LM-095':
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80',
  'LM-102':
    'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=300&q=80',
};

export const PRESET_DECOR_IMAGES: { label: string; url: string; color: string }[] = [
  {
    label: 'Đèn ngủ gốm sứ',
    url: SELLER_PRODUCT_IMAGES['LM-021'],
    color: '#f3c7c0',
  },
  {
    label: 'Khung tranh gỗ sồi',
    url: SELLER_PRODUCT_IMAGES['LM-044'],
    color: '#d9d2c6',
  },
  {
    label: 'Bình hoa thủy tinh',
    url: SELLER_PRODUCT_IMAGES['LM-007'],
    color: '#c8d9c9',
  },
  {
    label: 'Nến thơm tinh dầu',
    url: SELLER_PRODUCT_IMAGES['LM-063'],
    color: '#c9d3e0',
  },
  {
    label: 'Gương decor Bắc Âu',
    url: SELLER_PRODUCT_IMAGES['LM-088'],
    color: '#e8dfd5',
  },
  {
    label: 'Khay gốm sứ thủ công',
    url: SELLER_PRODUCT_IMAGES['LM-052'],
    color: '#dce5df',
  },
];

export const INITIAL_SELLER_PRODUCTS: SellerProduct[] = [];

export const INITIAL_SELLER_VOUCHERS: SellerVoucher[] = [
  {
    id: 1,
    code: 'LUMI20K',
    title: 'Giảm 20.000đ cho đơn từ 199K',
    discountText: '20.000đ',
    minOrderAmount: 199000,
    usedCount: 42,
    totalQuota: 100,
    expiryDate: '31/10/2026',
    active: true,
  },
  {
    id: 2,
    code: 'LUMINEW10',
    title: 'Giảm 10% khách hàng mới theo dõi shop',
    discountText: '10%',
    minOrderAmount: 150000,
    usedCount: 68,
    totalQuota: 200,
    expiryDate: '15/11/2026',
    active: true,
  },
];

export const INITIAL_SELLER_PROMOTIONS: SellerPromotion[] = [
  {
    id: 1,
    name: 'Flash Sale Góc Nhỏ Ấm Cúng — Tháng 10',
    discountPercent: 25,
    productCount: 4,
    timeRange: '14/10/2026 - 20/10/2026',
    status: 'RUNNING',
  },
  {
    id: 2,
    name: 'Combo Nến Thơm & Bình Hoa Thu Đông',
    discountPercent: 15,
    productCount: 3,
    timeRange: '25/10/2026 - 05/11/2026',
    status: 'UPCOMING',
  },
];

export const INITIAL_SELLER_REVIEWS: SellerReviewQuestion[] = [
  {
    id: 1,
    customerName: 'Nguyễn Ngọc Mai',
    productName: 'Đèn ngủ gốm Cloud',
    productImage: SELLER_PRODUCT_IMAGES['LM-021'],
    rating: 5,
    comment: 'Shop ơi đèn này dùng bóng đui xoáy E27 hay bóng LED tích hợp sẵn vậy ạ?',
    createdAt: '15 phút trước',
  },
  {
    id: 2,
    customerName: 'Hoàng Gia Bảo',
    productName: 'Nến thơm Lavender',
    productImage: SELLER_PRODUCT_IMAGES['LM-063'],
    rating: 5,
    comment: 'Mùi lavender dịu nhẹ rất thư giãn, đóng gói chống sốc cực kỳ cẩn thận. Cho mình hỏi hũ 200g đốt được khoảng bao nhiêu giờ?',
    createdAt: '1 giờ trước',
  },
  {
    id: 3,
    customerName: 'Vũ Thanh Tâm',
    productName: 'Khung tranh gỗ sồi A4',
    productImage: SELLER_PRODUCT_IMAGES['LM-044'],
    rating: 4,
    comment: 'Khung gỗ thật cầm nặng tay, shop có kèm đinh 3 chân treo tường không ạ?',
    createdAt: '3 giờ trước',
  },
  {
    id: 4,
    customerName: 'Đặng Khánh Linh',
    productName: 'Bình hoa thủy tinh',
    productImage: SELLER_PRODUCT_IMAGES['LM-007'],
    rating: 5,
    comment: 'Màu xanh sage ở ngoài đẹp hơn trong ảnh nữa, cắm cúc mẫu đơn rất hợp!',
    createdAt: 'Hôm qua',
    reply: 'Lumi Home Decor cảm ơn bạn Khánh Linh rất nhiều ạ! Chúc bạn luôn có không gian sống thật xinh nhé ❤️',
  },
];

export const INITIAL_SELLER_NOTIFICATIONS: SellerNotification[] = [
  {
    id: 1,
    title: 'Đơn hàng mới #VM240918',
    desc: 'Nguyễn Thu Hà vừa đặt Đèn ngủ gốm Cloud ×1 (420.000đ)',
    time: '5 phút trước',
    read: false,
    targetNav: 'orders',
  },
  {
    id: 2,
    title: 'Cảnh báo sắp hết hàng',
    desc: 'Đèn ngủ gốm Cloud (SKU LM-021) chỉ còn 2 sản phẩm trong kho',
    time: '18 phút trước',
    read: false,
    targetNav: 'inventory',
  },
  {
    id: 3,
    title: 'Yêu cầu hoàn tiền #VM240912',
    desc: 'Phạm Đức Long gửi yêu cầu đổi trả/hoàn tiền Bình hoa thủy tinh',
    time: '42 phút trước',
    read: false,
    targetNav: 'refunds',
  },
  {
    id: 4,
    title: 'Câu hỏi mới từ khách hàng',
    desc: 'Nguyễn Ngọc Mai đã đặt câu hỏi về Đèn ngủ gốm Cloud',
    time: '1 giờ trước',
    read: false,
    targetNav: 'reviews',
  },
  {
    id: 5,
    title: 'Đơn hàng mới #VM240917',
    desc: 'Trần Minh Quân vừa đặt Nến thơm Lavender ×3 (267.000đ)',
    time: '2 giờ trước',
    read: false,
    targetNav: 'orders',
  },
  {
    id: 6,
    title: 'Hồ sơ gian hàng đã duyệt',
    desc: 'Chúc mừng! Gian hàng Lumi Home Decor đã được kích hoạt chính thức.',
    time: 'Hôm qua',
    read: false,
    targetNav: 'profile',
  },
];

export const INITIAL_SHOP_PROFILE: SellerShopProfile = {
  shopName: 'Lumi Home Decor',
  tagline: 'Minimalist & Cozy Scandinavian Living',
  description:
    'Chuyên phụ kiện trang trí nhà cửa phong cách Bắc Âu tối giản: đèn gốm thủ công, nến thơm tinh dầu thiên nhiên, bình hoa thủy tinh và khung tranh gỗ sồi tự nhiên.',
  phone: '0987 654 321',
  email: 'hello@lumihomedecor.vn',
  pickupAddress: 'Số 45 Ngõ 82 Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
  businessHours: '08:30 - 21:00 (Thứ 2 - Chủ Nhật)',
};

export function createDefaultSellerDashboardData(): SellerDashboardData {
  const raw30 = [
    1.8, 2.2, 2.0, 2.9, 3.1, 2.7, 3.3, 3.0, 2.6, 3.5, 3.8, 3.2, 3.9, 4.1, 3.7,
    3.4, 4.0, 4.4, 3.9, 4.2, 4.6, 4.1, 3.8, 4.5, 4.7, 4.3, 4.9, 4.4, 4.1, 4.8,
  ];

  const chart30 = raw30.map((v, i) => ({
    label: `${i + 1}`,
    valueInMillions: v,
    exactRevenue: Math.round(v * 1000000),
    orderCount: Math.round(v * 5),
  }));

  return {
    shopId: 1,
    shopName: 'Lumi Home Decor',
    shopAvatarLetter: 'L',
    adminApproved: true,
    greetingTitle: 'Chào Lumi, hôm nay có 12 việc cần xử lý',
    currentDateText:
      'Thứ Tư, 14/10/2026 · Xử lý đơn mới trước 17:00 để giao trong ngày.',
    totalUrgentTasks: 12,
    unreadNotifications: 6,
    completedSteps: 2,
    totalSteps: 4,
    stats: {
      todayRevenue: 4820000,
      revenueGrowthPercent: 12,
      totalOrdersToday: 23,
      orderGrowthCount: 4,
      cancellationRate: 2.1,
      cancellationRateDiff: 0.4,
      averageRating: 4.8,
      totalReviews: 128,
    },
    todos: {
      pendingConfirmationOrders: 5,
      pendingPackagingOrders: 7,
      refundRequests: 2,
      lowStockAlerts: 4,
      unansweredQuestions: 3,
    },
    revenueChart7Days: [
      { label: 'T5', valueInMillions: 2.1, exactRevenue: 2100000, orderCount: 10 },
      { label: 'T6', valueInMillions: 3.4, exactRevenue: 3400000, orderCount: 16 },
      { label: 'T7', valueInMillions: 2.8, exactRevenue: 2800000, orderCount: 13 },
      { label: 'CN', valueInMillions: 4.1, exactRevenue: 4100000, orderCount: 20 },
      { label: 'T2', valueInMillions: 3.6, exactRevenue: 3600000, orderCount: 18 },
      { label: 'T3', valueInMillions: 4.3, exactRevenue: 4300000, orderCount: 21 },
      { label: 'T4', valueInMillions: 4.8, exactRevenue: 4820000, orderCount: 23 },
    ],
    revenueChart30Days: chart30,
    lowStockProducts: [
      {
        id: 1,
        name: 'Đèn ngủ gốm Cloud',
        variant: 'Màu kem',
        sku: 'LM-021',
        remainingQuantity: 2,
        thumbnailColor: '#f3c7c0',
        imageUrl: SELLER_PRODUCT_IMAGES['LM-021'],
        badgeType: 'danger',
      },
      {
        id: 2,
        name: 'Khung tranh gỗ sồi A4',
        variant: 'Size A4',
        sku: 'LM-044',
        remainingQuantity: 3,
        thumbnailColor: '#d9d2c6',
        imageUrl: SELLER_PRODUCT_IMAGES['LM-044'],
        badgeType: 'danger',
      },
      {
        id: 3,
        name: 'Bình hoa thủy tinh',
        variant: 'Xanh sage',
        sku: 'LM-007',
        remainingQuantity: 6,
        thumbnailColor: '#c8d9c9',
        imageUrl: SELLER_PRODUCT_IMAGES['LM-007'],
        badgeType: 'warning',
      },
      {
        id: 4,
        name: 'Nến thơm Lavender',
        variant: '200g',
        sku: 'LM-063',
        remainingQuantity: 8,
        thumbnailColor: '#c9d3e0',
        imageUrl: SELLER_PRODUCT_IMAGES['LM-063'],
        badgeType: 'warning',
      },
    ],
    recentOrders: [
      {
        id: 101,
        orderCode: '#VM240918',
        customerName: 'Nguyễn Thu Hà',
        customerPhone: '0912 345 678',
        shippingAddress: '188 Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy, Hà Nội',
        createdAt: '14/10/2026 09:12',
        productSummary: 'Đèn ngủ gốm Cloud ×1',
        productImage: SELLER_PRODUCT_IMAGES['LM-021'],
        totalAmount: 420000,
        status: 'PENDING_CONFIRMATION',
        statusLabel: 'Chờ xác nhận',
        badgeClass: 'w',
        actionText: 'Xác nhận',
        actionStyle: 'red',
        nextAction: 'CONFIRM',
      },
      {
        id: 102,
        orderCode: '#VM240917',
        customerName: 'Trần Minh Quân',
        customerPhone: '0988 765 432',
        shippingAddress: '72 Nguyễn Trãi, Phường Thượng Đình, Quận Thanh Xuân, Hà Nội',
        createdAt: '14/10/2026 08:45',
        productSummary: 'Nến thơm Lavender ×3',
        productImage: SELLER_PRODUCT_IMAGES['LM-063'],
        totalAmount: 267000,
        status: 'PENDING_CONFIRMATION',
        statusLabel: 'Chờ xác nhận',
        badgeClass: 'w',
        actionText: 'Xác nhận',
        actionStyle: 'red',
        nextAction: 'CONFIRM',
      },
      {
        id: 103,
        orderCode: '#VM240915',
        customerName: 'Lê Phương Anh',
        customerPhone: '0904 112 233',
        shippingAddress: 'Tòa S2 Vinhomes Skylake, Phạm Hùng, Nam Từ Liêm, Hà Nội',
        createdAt: '14/10/2026 07:30',
        productSummary: 'Khung tranh gỗ sồi A4 ×2',
        productImage: SELLER_PRODUCT_IMAGES['LM-044'],
        totalAmount: 380000,
        status: 'PREPARING',
        statusLabel: 'Đang chuẩn bị',
        badgeClass: 'o',
        actionText: 'Đã đóng gói',
        actionStyle: 'outline',
        nextAction: 'MARK_PACKED',
      },
      {
        id: 104,
        orderCode: '#VM240912',
        customerName: 'Phạm Đức Long',
        customerPhone: '0936 998 877',
        shippingAddress: '25 Lý Thường Kiệt, Quận Hoàn Kiếm, Hà Nội',
        createdAt: '13/10/2026 21:15',
        productSummary: 'Bình hoa thủy tinh ×1',
        productImage: SELLER_PRODUCT_IMAGES['LM-007'],
        totalAmount: 159000,
        status: 'REFUND_REQUEST',
        statusLabel: 'Hoàn tiền',
        badgeClass: 'r',
        actionText: 'Xem xét',
        actionStyle: 'outline',
        nextAction: 'REVIEW_REFUND',
      },
    ],
    products: INITIAL_SELLER_PRODUCTS,
  };
}
