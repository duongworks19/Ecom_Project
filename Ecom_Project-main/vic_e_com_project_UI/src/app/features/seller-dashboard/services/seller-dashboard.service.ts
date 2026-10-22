import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import {
  LowStockProduct,
  OrderFilterType,
  RevenuePoint,
  SellerDashboardData,
  SellerNavTab,
  SellerNotification,
  SellerProduct,
  SellerPromotion,
  SellerRecentOrder,
  SellerReviewQuestion,
  SellerShopProfile,
  SellerVoucher,
  VendorState,
  SellerReturnRequest,
  SellerQaQuestion,
} from '../models/seller-dashboard.model';
import {
  INITIAL_SELLER_NOTIFICATIONS,
  INITIAL_SELLER_PRODUCTS,
  INITIAL_SELLER_PROMOTIONS,
  INITIAL_SELLER_REVIEWS,
  INITIAL_SELLER_VOUCHERS,
  INITIAL_SHOP_PROFILE,
  PRESET_DECOR_IMAGES,
  SELLER_PRODUCT_IMAGES,
  createDefaultSellerDashboardData,
} from '../constants/seller-dashboard.mock';

@Injectable({
  providedIn: 'root',
})
export class SellerDashboardService {
  private readonly http = inject(HttpClient);
  private readonly BASE_API = 'http://localhost:9090/api/seller';
  private readonly DASHBOARD_API = `${this.BASE_API}/dashboard`;
  private readonly PRODUCTS_API = `${this.BASE_API}/products`;
  private readonly INVENTORY_API = `${this.BASE_API}/inventory`;
  private readonly ORDERS_API = `${this.BASE_API}/orders`;
  private readonly RETURNS_API = `${this.BASE_API}/returns`;
  private readonly VOUCHERS_API = `${this.BASE_API}/vouchers`;
  private readonly PROMOTIONS_API = `${this.BASE_API}/promotions`;
  private readonly REVIEWS_API = `${this.BASE_API}/reviews`;
  private readonly QA_API = `${this.BASE_API}/qa`;
  private readonly PROFILE_API = `${this.BASE_API}/profile`;

  readonly dashboard = signal<SellerDashboardData>(
    createDefaultSellerDashboardData()
  );
  readonly selectedRange = signal<'7' | '30'>('7');
  readonly activeNav = signal<SellerNavTab>('overview');
  readonly orderFilter = signal<OrderFilterType>('ALL');
  readonly notificationMessage = signal<string | null>(null);

  readonly products = signal<SellerProduct[]>(INITIAL_SELLER_PRODUCTS);
  readonly vouchers = signal<SellerVoucher[]>(INITIAL_SELLER_VOUCHERS);
  readonly promotions = signal<SellerPromotion[]>(INITIAL_SELLER_PROMOTIONS);
  readonly reviews = signal<SellerReviewQuestion[]>(INITIAL_SELLER_REVIEWS);
  readonly notifications = signal<SellerNotification[]>(
    INITIAL_SELLER_NOTIFICATIONS
  );
  readonly shopProfile = signal<SellerShopProfile>(INITIAL_SHOP_PROFILE);
  readonly shopState = signal<VendorState>('APPROVED');
  readonly returns = signal<SellerReturnRequest[]>([
    {
      id: 1,
      orderCode: 'VM2610-0377',
      customerName: 'Nguyễn Văn An',
      type: 'Trả hàng hoàn tiền',
      reason: 'Hàng bị nứt khi nhận',
      amount: 329000,
      evidenceImagesCount: 2,
      status: 'PENDING',
    },
    {
      id: 2,
      orderCode: 'VM2610-0369',
      customerName: 'Lê Thị Hoa',
      type: 'Đổi hàng',
      reason: 'Giao sai màu',
      amount: 179000,
      evidenceImagesCount: 1,
      status: 'PENDING',
    },
  ]);
  readonly qaQuestions = signal<SellerQaQuestion[]>([
    {
      id: 1,
      productName: 'Đèn ngủ gỗ sồi',
      customerName: 'Ngô Anh',
      question: 'Đèn ngủ có kèm bóng không ạ?',
    },
    {
      id: 2,
      productName: 'Kệ treo tường',
      customerName: 'Đỗ Minh',
      question: 'Kệ treo chịu tải tối đa bao nhiêu kg?',
    },
    {
      id: 3,
      productName: 'Bình gốm trắng',
      customerName: 'Lan Chi',
      question: 'Bình gốm có màu kem không shop?',
    },
  ]);

  readonly stepProductsDone = signal<boolean>(false);
  readonly stepVoucherDone = signal<boolean>(false);

  readonly unreadNotificationCount = computed(
    () => this.notifications().filter((n) => !n.read).length
  );

  readonly filteredOrders = computed(() => {
    const orders = this.dashboard().recentOrders;
    const filter = this.orderFilter();
    if (filter === 'ALL') return orders;
    if (filter === 'REFUND') {
      return orders.filter(
        (o) => o.status === 'REFUND_REQUEST' || o.status === 'IN_REVIEW'
      );
    }
    return orders.filter((o) => o.status === filter);
  });

  readonly refundOrders = computed(() =>
    this.dashboard().recentOrders.filter(
      (o) => o.status === 'REFUND_REQUEST' || o.status === 'IN_REVIEW'
    )
  );

  constructor() {
    this.loadDashboardData();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'vic_seller_onboarding_draft' || e.key === 'vic_vendor_applications_list') {
          this.applyStoredOnboardingDraft();
        }
      });
      window.addEventListener('vic-vendor-applications-changed', () => {
        this.applyStoredOnboardingDraft();
      });
    }
  }

  /**
   * Đồng bộ dữ liệu từ form đăng ký mở gian hàng (SellerOnboardingService)
   * sang trang chủ Kênh người bán (SellerDashboardService) và Trang chủ Shop.
   */
  syncFromOnboarding(appData: {
    shopInfo: { shopName: string; description: string; primaryCategory: string };
    contactInfo: {
      representativeName: string;
      phone: string;
      email: string;
      province: string;
      district: string;
      ward: string;
      detailedAddress: string;
    };
  }): void {
    const shopName = appData.shopInfo.shopName?.trim();
    if (!shopName) return;

    const warehouseParts = [
      appData.contactInfo.detailedAddress,
      appData.contactInfo.ward,
      appData.contactInfo.district,
      appData.contactInfo.province,
    ].filter(Boolean);

    const currentProfile = this.shopProfile();
    const updatedProfile: SellerShopProfile = {
      ...currentProfile,
      shopName,
      tagline:
        appData.shopInfo.description?.trim() ||
        `Chuyên ngành ${appData.shopInfo.primaryCategory || 'thương mại điện tử'}`,
      description:
        appData.shopInfo.description?.trim() || 'Gian hàng mới mở bán trên sàn thương mại điện tử VIC MART.',
      pickupAddress:
        warehouseParts.length > 0
          ? warehouseParts.join(', ')
          : currentProfile.pickupAddress,
      phone: appData.contactInfo.phone?.trim() || currentProfile.phone,
      email: appData.contactInfo.email?.trim() || currentProfile.email,
    };

    this.shopProfile.set(updatedProfile);

    // Kiểm tra xem người bán này đã có sản phẩm tự đăng chưa
    const customProdsKey = `vic_seller_custom_products_${shopName}`;
    let customProducts: SellerProduct[] = [];
    if (typeof window !== 'undefined') {
      try {
        const savedProds = localStorage.getItem(customProdsKey);
        if (savedProds) {
          customProducts = JSON.parse(savedProds);
        }
      } catch {
        customProducts = [];
      }
    }

    // Shop mới được cấp phép: nếu chưa đăng hàng -> danh sách sản phẩm ban đầu là [] (rỗng)
    this.products.set(customProducts);
    this.stepProductsDone.set(customProducts.length > 0);

    const customVouchersKey = `vic_seller_custom_vouchers_${shopName}`;
    let customVouchers: SellerVoucher[] = [];
    if (typeof window !== 'undefined') {
      try {
        const savedVouchers = localStorage.getItem(customVouchersKey);
        if (savedVouchers) {
          customVouchers = JSON.parse(savedVouchers);
        }
      } catch {
        customVouchers = [];
      }
    }
    this.vouchers.set(customVouchers);
    this.stepVoucherDone.set(customVouchers.length > 0);

    this.reviews.set([]);
    this.promotions.set([]);

    const shortName = shopName.split(' ')[0] || shopName;
    const completedSteps = (customProducts.length > 0 ? 3 : 2) + (customVouchers.length > 0 ? 1 : 0);

    this.dashboard.set({
      shopId: Date.now(),
      shopName,
      shopAvatarLetter: shopName.charAt(0).toUpperCase(),
      greetingTitle:
        customProducts.length > 0
          ? `Chào ${shortName}, gian hàng của bạn đang hoạt động`
          : `Chào ${shortName}, gian hàng của bạn đã sẵn sàng bán hàng!`,
      currentDateText: this.getCurrentDateText(),
      adminApproved: true,
      totalUrgentTasks: 0,
      unreadNotifications: 0,
      completedSteps,
      totalSteps: 4,
      todos: {
        pendingConfirmationOrders: 0,
        pendingPackagingOrders: 0,
        refundRequests: 0,
        lowStockAlerts: customProducts.filter((p) => p.stock <= 10).length,
        unansweredQuestions: 0,
      },
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
      revenueChart7Days: this.createEmpty7DaysChart(),
      revenueChart30Days: this.createEmpty30DaysChart(),
      lowStockProducts: customProducts
        .filter((p) => p.stock <= 10)
        .map((p) => ({
          id: p.id,
          name: p.name,
          variant: p.variant,
          sku: p.sku,
          remainingQuantity: p.stock,
          thumbnailColor: p.thumbnailColor,
          imageUrl: p.imageUrl,
          badgeType: p.stock < 5 ? 'danger' : 'warning',
        })),
      recentOrders: [],
      products: customProducts,
      shopProfile: updatedProfile,
    });
  }

  private getCurrentDateText(): string {
    const d = new Date();
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  }

  private createEmpty7DaysChart(): RevenuePoint[] {
    const days = ['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4'];
    return days.map((day) => ({
      label: day,
      valueInMillions: 0,
      exactRevenue: 0,
      orderCount: 0,
    }));
  }

  private createEmpty30DaysChart(): RevenuePoint[] {
    const res: RevenuePoint[] = [];
    for (let i = 1; i <= 30; i++) {
      res.push({
        label: `${i}`,
        valueInMillions: 0,
        exactRevenue: 0,
        orderCount: 0,
      });
    }
    return res;
  }

  loadDashboardData(): void {
    this.http
      .get<{ code?: number; success?: boolean; message: string; data: SellerDashboardData }>(
        this.DASHBOARD_API
      )
      .pipe(
        map((res) => this.hydrateDashboardImages(res.data)),
        catchError(() => of(createDefaultSellerDashboardData()))
      )
      .subscribe((data) => {
        if (data) {
          this.dashboard.set(data);
          if (data.products && data.products.length > 0) {
            this.products.set(data.products);
          }
          if (data.vouchers && data.vouchers.length > 0) {
            this.vouchers.set(data.vouchers);
          }
          if (data.promotions && data.promotions.length > 0) {
            this.promotions.set(data.promotions);
          }
          if (data.reviews && data.reviews.length > 0) {
            this.reviews.set(data.reviews);
          }
          if (data.shopProfile) {
            this.shopProfile.set(data.shopProfile);
          }
        }
        // Always apply stored onboarding/vendor approval state so newly approved shop starts empty
        this.applyStoredOnboardingDraft();
      });
  }

  private applyStoredOnboardingDraft(): void {
    try {
      let draftData: any = null;
      const raw = localStorage.getItem('vic_seller_onboarding_draft');
      if (raw) {
        draftData = JSON.parse(raw);
      }

      // If no draft in draft key, check if there's a shop in the applications list
      if (!draftData?.shopInfo?.shopName) {
        const appsRaw = localStorage.getItem('vic_vendor_applications_list');
        if (appsRaw) {
          const apps = JSON.parse(appsRaw);
          if (Array.isArray(apps) && apps.length > 0) {
            const approvedApp = apps.slice().reverse().find((a: any) => a.status === 'APPROVED') || apps[apps.length - 1];
            if (approvedApp) {
              draftData = {
                shopInfo: {
                  shopName: approvedApp.shop || approvedApp.shopName,
                  description: approvedApp.desc || approvedApp.description || '',
                  primaryCategory: approvedApp.cat || approvedApp.category || 'Thời trang & Phụ kiện',
                },
                contactInfo: {
                  representativeName: approvedApp.owner || approvedApp.representativeName || '',
                  phone: approvedApp.phone || '',
                  email: approvedApp.email || '',
                  province: '',
                  district: '',
                  ward: '',
                  detailedAddress: approvedApp.pickup || approvedApp.address || '',
                },
              };
            }
          }
        }
      }

      if (draftData?.shopInfo?.shopName) {
        this.syncFromOnboarding(draftData);
      }
    } catch {
      // Ignore localStorage parse errors
    }
  }

  private hydrateDashboardImages(data: SellerDashboardData): SellerDashboardData {
    if (!data) return createDefaultSellerDashboardData();

    const fallback = createDefaultSellerDashboardData();

    const hydratedLowStock: LowStockProduct[] = (
      data.lowStockProducts || fallback.lowStockProducts
    ).map((item) => ({
      ...item,
      imageUrl:
        item.imageUrl ||
        SELLER_PRODUCT_IMAGES[item.sku] ||
        PRESET_DECOR_IMAGES[(item.id - 1) % PRESET_DECOR_IMAGES.length]?.url,
    }));

    const hydratedOrders: SellerRecentOrder[] = (
      data.recentOrders || fallback.recentOrders
    ).map((order, idx) => {
      const fallbackOrder = fallback.recentOrders[idx];
      let matchedImg = order.productImage || fallbackOrder?.productImage;
      if (!matchedImg) {
        if (order.productSummary.includes('Đèn ngủ')) {
          matchedImg = SELLER_PRODUCT_IMAGES['LM-021'];
        } else if (order.productSummary.includes('Khung tranh')) {
          matchedImg = SELLER_PRODUCT_IMAGES['LM-044'];
        } else if (order.productSummary.includes('Bình hoa')) {
          matchedImg = SELLER_PRODUCT_IMAGES['LM-007'];
        } else if (order.productSummary.includes('Nến thơm')) {
          matchedImg = SELLER_PRODUCT_IMAGES['LM-063'];
        }
      }
      return {
        ...fallbackOrder,
        ...order,
        productImage: matchedImg,
      };
    });

    const hydratedProducts: SellerProduct[] = (
      data.products && data.products.length > 0
        ? data.products
        : INITIAL_SELLER_PRODUCTS
    ).map((p) => ({
      ...p,
      imageUrl: p.imageUrl || SELLER_PRODUCT_IMAGES[p.sku] || PRESET_DECOR_IMAGES[0].url,
    }));

    return {
      ...data,
      lowStockProducts: hydratedLowStock,
      recentOrders: hydratedOrders,
      products: hydratedProducts,
    };
  }

  setRange(range: '7' | '30'): void {
    this.selectedRange.set(range);
  }

  setActiveNav(nav: SellerNavTab, filter?: OrderFilterType): void {
    this.activeNav.set(nav);
    if (filter) {
      this.orderFilter.set(filter);
    } else if (nav === 'refunds') {
      this.orderFilter.set('REFUND');
    } else if (nav === 'orders') {
      this.orderFilter.set('ALL');
    }
  }

  setOrderFilter(filter: OrderFilterType): void {
    this.orderFilter.set(filter);
  }

  handleQuickAction(orderCode: string, action: string): void {
    const current = this.dashboard();
    if (!current) return;

    this.http
      .post<{ code?: number; data: SellerRecentOrder }>(
        `${this.ORDERS_API}/${encodeURIComponent(orderCode)}/action`,
        { action }
      )
      .pipe(catchError(() => of(null)))
      .subscribe();

    const updatedOrders: SellerRecentOrder[] = current.recentOrders.map((order) => {
      if (order.orderCode !== orderCode) return order;

      if (action === 'CONFIRM') {
        return {
          ...order,
          status: 'PREPARING',
          statusLabel: 'Đang chuẩn bị',
          badgeClass: 'o',
          actionText: 'Đã đóng gói',
          actionStyle: 'outline',
          nextAction: 'MARK_PACKED',
        };
      }
      if (action === 'MARK_PACKED') {
        return {
          ...order,
          status: 'PACKED',
          statusLabel: 'Chờ lấy hàng',
          badgeClass: 'o',
          actionText: 'Chi tiết',
          actionStyle: 'outline',
          nextAction: 'VIEW_DETAIL',
        };
      }
      if (action === 'REVIEW_REFUND') {
        return {
          ...order,
          status: 'IN_REVIEW',
          statusLabel: 'Đang xem xét',
          badgeClass: 'w',
          actionText: 'Duyệt hoàn',
          actionStyle: 'red',
          nextAction: 'APPROVE_REFUND',
        };
      }
      if (action === 'APPROVE_REFUND') {
        return {
          ...order,
          status: 'COMPLETED',
          statusLabel: 'Đã hoàn tiền',
          badgeClass: 'o',
          actionText: 'Chi tiết',
          actionStyle: 'outline',
          nextAction: 'VIEW_DETAIL',
        };
      }
      return order;
    });

    const updatedTodos = { ...current.todos };
    if (action === 'CONFIRM' && updatedTodos.pendingConfirmationOrders > 0) {
      updatedTodos.pendingConfirmationOrders -= 1;
      updatedTodos.pendingPackagingOrders += 1;
    } else if (action === 'MARK_PACKED' && updatedTodos.pendingPackagingOrders > 0) {
      updatedTodos.pendingPackagingOrders -= 1;
    } else if (action === 'APPROVE_REFUND' && updatedTodos.refundRequests > 0) {
      updatedTodos.refundRequests -= 1;
    }

    this.dashboard.set({
      ...current,
      todos: updatedTodos,
      recentOrders: updatedOrders,
    });

    this.showToast(`Đã cập nhật trạng thái đơn hàng ${orderCode}!`);
  }

  restockProduct(productId: number, addedQuantity: number): void {
    if (addedQuantity <= 0) return;

    const currentProducts = this.products();
    const target = currentProducts.find((p) => p.id === productId);
    const newStock = (target ? target.stock : 0) + addedQuantity;

    this.http
      .patch(`${this.INVENTORY_API}/${productId}/stock`, {
        newQuantity: newStock,
        addQuantity: addedQuantity,
      })
      .pipe(catchError(() => of(null)))
      .subscribe();

    const updatedProducts: SellerProduct[] = currentProducts.map((p) => {
      if (p.id !== productId) return p;
      const updatedQty = p.stock + addedQuantity;
      return {
        ...p,
        stock: updatedQty,
        status: updatedQty <= 10 ? 'LOW_STOCK' : 'ACTIVE',
      };
    });
    this.products.set(updatedProducts);

    this.syncLowStockFromProducts(updatedProducts);
    this.showToast(
      `Đã nhập thêm +${addedQuantity} sản phẩm vào kho (${target?.name || ''})!`
    );
  }

  addNewProduct(payload: {
    name: string;
    variant: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    imageUrl: string;
    thumbnailColor: string;
  }): void {
    const newProd: SellerProduct = {
      id: Date.now(),
      name: payload.name.trim(),
      variant: payload.variant.trim() || 'Tiêu chuẩn',
      sku: payload.sku.trim().toUpperCase() || `LM-${100 + (Date.now() % 900)}`,
      category: payload.category || 'Đèn trang trí',
      price: Number(payload.price) || 150000,
      stock: Number(payload.stock) || 20,
      soldCount: 0,
      thumbnailColor: payload.thumbnailColor || '#f3c7c0',
      imageUrl: payload.imageUrl || PRESET_DECOR_IMAGES[0].url,
      status: Number(payload.stock) <= 10 ? 'LOW_STOCK' : 'ACTIVE',
    };

    const updatedProducts = [newProd, ...this.products()];
    this.products.set(updatedProducts);

    const shopName = this.dashboard().shopName;
    if (typeof window !== 'undefined' && shopName) {
      try {
        localStorage.setItem(`vic_seller_custom_products_${shopName}`, JSON.stringify(updatedProducts));
      } catch (e) {
        console.error('Failed to save custom products', e);
      }
    }

    if (!this.stepProductsDone()) {
      this.stepProductsDone.set(true);
      this.recalculateCompletedSteps();
    }

    this.syncLowStockFromProducts(updatedProducts);
    this.showToast(`Đã đăng sản phẩm "${newProd.name}" và lưu vào cơ sở dữ liệu!`);

    this.http
      .post<{ code?: number; data?: SellerProduct }>(this.PRODUCTS_API, newProd)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.data?.id) {
          const savedProduct: SellerProduct = {
            ...newProd,
            ...res.data,
            price: Number(res.data.price),
          };
          const syncedList = this.products().map((p) =>
            p.id === newProd.id ? savedProduct : p
          );
          this.products.set(syncedList);
          this.syncLowStockFromProducts(syncedList);
          if (typeof window !== 'undefined' && shopName) {
            localStorage.setItem(`vic_seller_custom_products_${shopName}`, JSON.stringify(syncedList));
          }
        }
      });
  }

  createVoucher(payload: {
    code: string;
    title: string;
    discountText: string;
    minOrderAmount: number;
    totalQuota: number;
    expiryDate: string;
  }): void {
    const newVoucher: SellerVoucher = {
      id: Date.now(),
      code: payload.code.trim().toUpperCase(),
      title: payload.title.trim(),
      discountText: payload.discountText.trim(),
      minOrderAmount: Number(payload.minOrderAmount) || 100000,
      usedCount: 0,
      totalQuota: Number(payload.totalQuota) || 50,
      expiryDate: payload.expiryDate || '30/11/2026',
      active: true,
    };

    const updatedVouchers = [newVoucher, ...this.vouchers()];
    this.vouchers.set(updatedVouchers);

    const shopName = this.dashboard().shopName;
    if (typeof window !== 'undefined' && shopName) {
      try {
        localStorage.setItem(`vic_seller_custom_vouchers_${shopName}`, JSON.stringify(updatedVouchers));
      } catch (e) {
        console.error('Failed to save custom vouchers', e);
      }
    }

    if (!this.stepVoucherDone()) {
      this.stepVoucherDone.set(true);
      this.recalculateCompletedSteps();
    }
    this.showToast(`Đã tạo mã giảm giá ${newVoucher.code} thành công!`);

    this.http
      .post<{ code?: number; data?: SellerVoucher }>(this.VOUCHERS_API, newVoucher)
      .pipe(catchError(() => of(null)))
      .subscribe((res) => {
        if (res?.data?.id) {
          this.vouchers.update((list) =>
            list.map((v) =>
              v.id === newVoucher.id
                ? { ...newVoucher, ...res.data, minOrderAmount: Number(res.data!.minOrderAmount) }
                : v
            )
          );
        }
      });
  }

  toggleVoucherStatus(voucherId: number): void {
    this.vouchers.update((list) =>
      list.map((v) => (v.id === voucherId ? { ...v, active: !v.active } : v))
    );
    this.http
      .patch(`${this.VOUCHERS_API}/${voucherId}/toggle`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã cập nhật trạng thái voucher!');
  }

  replyCustomerReview(reviewId: number, replyText: string): void {
    const trimmed = replyText.trim();
    if (!trimmed) return;

    const target = this.reviews().find((r) => r.id === reviewId);
    const wasUnanswered = target && !target.reply;

    this.reviews.update((list) =>
      list.map((r) => (r.id === reviewId ? { ...r, reply: trimmed } : r))
    );

    this.http
      .post(`${this.REVIEWS_API}/${reviewId}/reply`, { reply: trimmed })
      .pipe(catchError(() => of(null)))
      .subscribe();

    if (wasUnanswered) {
      const curr = this.dashboard();
      const unanswered = Math.max(0, curr.todos.unansweredQuestions - 1);
      this.dashboard.set({
        ...curr,
        todos: {
          ...curr.todos,
          unansweredQuestions: unanswered,
        },
      });
    }

    this.showToast('Đã gửi phản hồi cho khách hàng!');
  }

  saveShopProfile(profile: SellerShopProfile): void {
    this.shopProfile.set(profile);
    const curr = this.dashboard();
    const shopName = profile.shopName.trim() || curr.shopName;
    this.dashboard.set({
      ...curr,
      shopName,
      shopAvatarLetter: shopName.charAt(0).toUpperCase(),
    });
    this.http
      .put(this.PROFILE_API, profile)
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã lưu thông tin hồ sơ gian hàng vào cơ sở dữ liệu!');
  }

  updateShopProfile(profile: SellerShopProfile): void {
    this.saveShopProfile(profile);
  }

  replyToReview(reviewId: number, replyText: string): void {
    this.replyCustomerReview(reviewId, replyText);
  }

  markNotificationAsRead(notif: SellerNotification): void {
    this.notifications.update((list) =>
      list.map((item) => (item.id === notif.id ? { ...item, read: true } : item))
    );
    this.setActiveNav(notif.targetNav);
  }

  markAllNotificationsAsRead(): void {
    this.notifications.update((list) =>
      list.map((item) => ({ ...item, read: true }))
    );
    this.showToast('Đã đánh dấu tất cả thông báo là đã đọc');
  }

  private syncLowStockFromProducts(products: SellerProduct[]): void {
    const lowList: LowStockProduct[] = products
      .filter((p) => p.stock <= 10)
      .map((p) => ({
        id: p.id,
        name: p.name,
        variant: p.variant,
        sku: p.sku,
        remainingQuantity: p.stock,
        thumbnailColor: p.thumbnailColor,
        imageUrl: p.imageUrl,
        badgeType: p.stock < 5 ? 'danger' : 'warning',
      }));

    const curr = this.dashboard();
    this.dashboard.set({
      ...curr,
      lowStockProducts: lowList,
      todos: {
        ...curr.todos,
        lowStockAlerts: lowList.length,
      },
    });
  }

  private recalculateCompletedSteps(): void {
    const curr = this.dashboard();
    const completed =
      2 + (this.stepProductsDone() ? 1 : 0) + (this.stepVoucherDone() ? 1 : 0);
    this.dashboard.set({
      ...curr,
      completedSteps: completed,
    });
  }

  setShopState(st: VendorState): void {
    this.shopState.set(st);
  }

  acceptReturn(id: number): void {
    this.returns.update((list) =>
      list.map((r) => (r.id === id ? { ...r, status: 'APPROVED' } : r))
    );
    this.http
      .post(`${this.RETURNS_API}/${id}/accept`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã chấp nhận yêu cầu đổi trả. Hệ thống hoàn tiền và nhập lại kho.');
  }

  rejectReturn(id: number, reason: string): void {
    this.returns.update((list) =>
      list.map((r) => (r.id === id ? { ...r, status: 'REJECTED', rejectReason: reason } : r))
    );
    this.http
      .post(`${this.RETURNS_API}/${id}/reject`, { reason })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã từ chối yêu cầu đổi trả. Lý do đã gửi cho khách hàng.');
  }

  answerQa(id: number, answer: string): void {
    this.qaQuestions.update((list) =>
      list.map((q) => (q.id === id ? { ...q, answer } : q))
    );
    this.http
      .post(`${this.QA_API}/${id}/answer`, { answer })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã gửi câu trả lời cho khách hàng.');
  }

  deleteProduct(id: number): void {
    const list = this.products().filter((p) => p.id !== id);
    this.products.set(list);
    const shopName = this.dashboard().shopName;
    if (typeof window !== 'undefined' && shopName) {
      localStorage.setItem(`vic_seller_custom_products_${shopName}`, JSON.stringify(list));
    }
    this.syncLowStockFromProducts(list);
    this.http
      .delete(`${this.PRODUCTS_API}/${id}`)
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã xóa sản phẩm khỏi gian hàng.');
  }

  toggleProductVisibility(id: number): void {
    this.products.update((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        const nextStatus = p.status === 'HIDDEN' ? 'ACTIVE' : 'HIDDEN';
        return { ...p, status: nextStatus };
      })
    );
    const shopName = this.dashboard().shopName;
    if (typeof window !== 'undefined' && shopName) {
      localStorage.setItem(`vic_seller_custom_products_${shopName}`, JSON.stringify(this.products()));
    }
    this.http
      .patch(`${this.PRODUCTS_API}/${id}/visibility`, {})
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã cập nhật trạng thái hiển thị của sản phẩm.');
  }

  deleteVoucher(code: string): void {
    const updated = this.vouchers().filter((v) => v.code !== code);
    this.vouchers.set(updated);
    const shopName = this.dashboard().shopName;
    if (typeof window !== 'undefined' && shopName) {
      localStorage.setItem(`vic_seller_custom_vouchers_${shopName}`, JSON.stringify(updated));
    }
    this.http
      .delete(`${this.VOUCHERS_API}/${encodeURIComponent(code)}`)
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast(`Đã xóa voucher ${code}.`);
  }

  updateVariantStockDirect(productId: number, newStock: number, threshold: number): void {
    this.products.update((list) =>
      list.map((p) => {
        if (p.id !== productId) return p;
        return {
          ...p,
          stock: newStock,
          status: newStock <= threshold ? 'LOW_STOCK' : 'ACTIVE',
        };
      })
    );
    const shopName = this.dashboard().shopName;
    if (typeof window !== 'undefined' && shopName) {
      localStorage.setItem(`vic_seller_custom_products_${shopName}`, JSON.stringify(this.products()));
    }
    this.syncLowStockFromProducts(this.products());
    this.http
      .patch(`${this.INVENTORY_API}/${productId}/stock-direct`, { newStock, threshold })
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã lưu tồn kho. Ghi nhật ký MANUAL.');
  }

  showToast(msg: string): void {
    this.notificationMessage.set(msg);
    setTimeout(() => {
      if (this.notificationMessage() === msg) {
        this.notificationMessage.set(null);
      }
    }, 3000);
  }
}
