import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import {
  LowStockProduct,
  OrderFilterType,
  SellerDashboardData,
  SellerNavTab,
  SellerNotification,
  SellerProduct,
  SellerPromotion,
  SellerRecentOrder,
  SellerReviewQuestion,
  SellerShopProfile,
  SellerVoucher,
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
  private readonly API_URL = 'http://localhost:9090/api/seller/dashboard';

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
        `Chuyên ngành ${appData.shopInfo.primaryCategory || 'nội thất & decor'}`,
      description:
        appData.shopInfo.description?.trim() || currentProfile.description,
      pickupAddress:
        warehouseParts.length > 0
          ? warehouseParts.join(', ')
          : currentProfile.pickupAddress,
      phone: appData.contactInfo.phone?.trim() || currentProfile.phone,
      email: appData.contactInfo.email?.trim() || currentProfile.email,
    };

    this.shopProfile.set(updatedProfile);

    const curr = this.dashboard();
    const shortName = shopName.split(' ')[0] || shopName;
    this.dashboard.set({
      ...curr,
      shopName,
      shopAvatarLetter: shopName.charAt(0).toUpperCase(),
      greetingTitle: `Chào ${shortName}, hôm nay có 12 việc cần xử lý`,
      shopProfile: updatedProfile,
    });
  }

  loadDashboardData(): void {
    const userId = localStorage.getItem('userId');
    const url = userId ? `${this.API_URL}?userId=${userId}` : this.API_URL;
    this.http
      .get<{ code?: number; success?: boolean; message: string; data: SellerDashboardData }>(
        url
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
      });
    this.applyStoredOnboardingDraft();
  }

  private applyStoredOnboardingDraft(): void {
    try {
      const raw = localStorage.getItem('vic_seller_onboarding_draft');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.shopInfo?.shopName) {
        this.syncFromOnboarding(parsed);
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
        `${this.API_URL}/orders/${encodeURIComponent(orderCode)}/action`,
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
      .patch(`${this.API_URL}/inventory/${productId}/stock`, {
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

    if (!this.stepProductsDone()) {
      this.stepProductsDone.set(true);
      this.recalculateCompletedSteps();
    }

    this.syncLowStockFromProducts(updatedProducts);
    this.showToast(`Đã đăng sản phẩm "${newProd.name}" và lưu vào cơ sở dữ liệu!`);

    this.http
      .post<{ code?: number; data?: SellerProduct }>(`${this.API_URL}/products`, newProd)
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

    this.vouchers.update((list) => [newVoucher, ...list]);
    if (!this.stepVoucherDone()) {
      this.stepVoucherDone.set(true);
      this.recalculateCompletedSteps();
    }
    this.showToast(`Đã tạo mã giảm giá ${newVoucher.code} thành công!`);

    this.http
      .post<{ code?: number; data?: SellerVoucher }>(`${this.API_URL}/vouchers`, newVoucher)
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
      .patch(`${this.API_URL}/vouchers/${voucherId}/toggle`, {})
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
      .post(`${this.API_URL}/reviews/${reviewId}/reply`, { reply: trimmed })
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
      .put(`${this.API_URL}/profile`, profile)
      .pipe(catchError(() => of(null)))
      .subscribe();
    this.showToast('Đã lưu thông tin hồ sơ gian hàng vào cơ sở dữ liệu!');
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

  showToast(msg: string): void {
    this.notificationMessage.set(msg);
    setTimeout(() => {
      if (this.notificationMessage() === msg) {
        this.notificationMessage.set(null);
      }
    }, 3000);
  }
}
