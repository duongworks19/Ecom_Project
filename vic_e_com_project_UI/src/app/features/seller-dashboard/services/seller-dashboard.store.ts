import { Injectable, computed, signal } from '@angular/core';
import {
  CampaignItem,
  OrderItem,
  QuestionItem,
  ReturnItem,
  ReviewItem,
  VoucherItem,
} from '../models/seller-dashboard.model';
import { SellerProduct } from './seller-product.service';

export interface ShopProfileData {
  n: string;
  d: string;
  ph: string;
  em: string;
  ad: string;
  hr: string;
  logo?: string;
  banner?: string;
}

export interface SellerPageNotificationItem {
  id: string;
  pageKey: string;
  title: string;
  desc: string;
  time: string;
  route: string;
  read: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class SellerDashboardStore {
  // Shop & Vendor Profile
  readonly currentShopId = signal<number | null>(null);
  readonly shopStatus = signal<string>('APPROVED');
  readonly shopProfile = signal<ShopProfileData>({
    n: '',
    d: '',
    ph: '',
    em: '',
    ad: '',
    hr: '08:00 – 21:00',
  });

  // Active sub-page inside Seller Dashboard
  readonly activePageKey = signal<string>('overview');
  readonly readNotificationIds = signal<Record<string, boolean>>({});

  // Core Data Lists (Real Database Data)
  readonly products = signal<SellerProduct[]>([]);
  readonly orders = signal<OrderItem[]>([]);
  readonly returns = signal<ReturnItem[]>([]);
  readonly reviews = signal<ReviewItem[]>([]);
  readonly questions = signal<QuestionItem[]>([]);
  readonly vouchers = signal<VoucherItem[]>([]);
  readonly campaigns = signal<CampaignItem[]>([]);

  // Toast State
  readonly toastMessage = signal<string | null>(null);
  readonly isToastError = signal<boolean>(false);
  private toastTimer?: any;

  // Computed: Số đếm "cần làm" (Tasks & Status Counts)
  readonly pendingOrderCount = computed(() => this.orders().filter((o) => o.s === 'PENDING').length);
  readonly preparingOrderCount = computed(() => this.orders().filter((o) => o.s === 'PREPARING').length);
  readonly packedOrderCount = computed(() => this.orders().filter((o) => o.s === 'PACKED').length);
  readonly readyOrderCount = computed(() => this.orders().filter((o) => o.s === 'READY_TO_SHIP').length);
  readonly deliveredOrderCount = computed(() => this.orders().filter((o) => o.s === 'DELIVERED').length);
  readonly openOrdersCount = computed(() => this.pendingOrderCount() + this.preparingOrderCount() + this.packedOrderCount());

  readonly pendingReturnCount = computed(() => this.returns().filter((r) => r.st === 'PENDING').length);
  readonly unrepliedQuestionCount = computed(() => this.questions().filter((q) => !q.a).length);
  readonly unrepliedReviewCount = computed(() => this.reviews().filter((r) => !r.re).length);

  readonly lowStockItems = computed(() =>
    this.products().flatMap((p) =>
      (p.v || [])
        .filter((v) => v.q <= v.l)
        .map((v) => ({ ...v, productName: p.n, n: p.n, productId: p.id }))
    )
  );

  readonly totalTodoCount = computed(
    () =>
      this.pendingOrderCount() +
      this.preparingOrderCount() +
      this.pendingReturnCount() +
      this.lowStockItems().length +
      this.unrepliedQuestionCount() +
      this.unrepliedReviewCount()
  );

  readonly allProductCount = computed(() => this.products().filter((p) => p.s !== 'DELETED').length);
  readonly visibleProductCount = computed(() => this.products().filter((p) => p.s === 'VISIBLE').length);
  readonly hiddenProductCount = computed(() => this.products().filter((p) => p.s === 'HIDDEN').length);
  readonly draftProductCount = computed(() => this.products().filter((p) => p.s === 'DRAFT').length);

  readonly currentPageLabel = computed(() => {
    switch (this.activePageKey()) {
      case 'orders':
        return 'Tất cả đơn';
      case 'returns':
        return 'Đổi trả / Hoàn tiền';
      case 'products':
        return 'Danh sách sản phẩm';
      case 'inventory':
        return 'Kho hàng';
      case 'vouchers':
        return 'Voucher của shop';
      case 'campaigns':
        return 'Chương trình giảm giá';
      case 'reviews':
        return 'Đánh giá';
      case 'qa':
        return 'Hỏi đáp';
      case 'profile':
        return 'Hồ sơ gian hàng';
      default:
        return 'Tổng quan';
    }
  });

  // Real notifications per page from Database
  readonly currentPageNotifications = computed<SellerPageNotificationItem[]>(() => {
    const page = this.activePageKey();
    const readMap = this.readNotificationIds();

    const orderNotifs: SellerPageNotificationItem[] = this.orders()
      .filter((o) => o.s === 'PENDING' || o.s === 'PREPARING' || o.s === 'PACKED')
      .map((o) => {
        const id = `order_${o.c}_${o.s}`;
        const statusTitle =
          o.s === 'PENDING'
            ? `Đơn hàng chờ xác nhận #${o.c}`
            : o.s === 'PREPARING'
              ? `Đơn hàng chờ đóng gói #${o.c}`
              : `Đơn hàng sẵn sàng giao #${o.c}`;
        return {
          id,
          pageKey: 'orders',
          title: statusTitle,
          desc: `${o.n} · ${o.k} sản phẩm · ${(o.t || 0).toLocaleString('vi-VN')}đ`,
          time: o.h || 'Vừa xong',
          route: '/seller/dashboard/orders',
          read: !!readMap[id],
        };
      });

    const returnNotifs: SellerPageNotificationItem[] = this.returns()
      .filter((r) => r.st === 'PENDING')
      .map((r) => {
        const id = `return_${r.id}`;
        return {
          id,
          pageKey: 'returns',
          title: `Yêu cầu đổi trả #${r.o}`,
          desc: `${r.n} · ${r.type}: ${r.why} (${(r.amt || 0).toLocaleString('vi-VN')}đ)`,
          time: 'Chờ xử lý',
          route: '/seller/dashboard/returns',
          read: !!readMap[id],
        };
      });

    const productNotifs: SellerPageNotificationItem[] = this.products()
      .filter((p) => p.s === 'DRAFT' || p.s === 'HIDDEN')
      .map((p) => {
        const id = `product_${p.id}_${p.s}`;
        return {
          id,
          pageKey: 'products',
          title: p.s === 'DRAFT' ? `Sản phẩm bản nháp: ${p.n}` : `Sản phẩm đang ẩn: ${p.n}`,
          desc: p.s === 'DRAFT' ? 'Hoàn tất thông tin để hiển thị sản phẩm trên shop' : 'Sản phẩm đang tạm ẩn khỏi gian hàng khách',
          time: p.s === 'DRAFT' ? 'Bản nháp' : 'Đang ẩn',
          route: '/seller/dashboard/products',
          read: !!readMap[id],
        };
      });

    const inventoryNotifs: SellerPageNotificationItem[] = this.lowStockItems().map((s) => {
      const id = `inv_${s.productId}_${s.sku}`;
      return {
        id,
        pageKey: 'inventory',
        title: `Cảnh báo sắp hết hàng: ${s.n}`,
        desc: `SKU ${s.sku} · Chỉ còn ${s.q} sản phẩm (Ngưỡng cảnh báo: ${s.l})`,
        time: 'Cần nhập kho',
        route: '/seller/dashboard/inventory',
        read: !!readMap[id],
      };
    });

    const voucherNotifs: SellerPageNotificationItem[] = this.vouchers()
      .filter((v) => v.st === 'PAUSED' || (v.lim > 0 && v.used >= v.lim))
      .map((v) => {
        const id = `voucher_${v.code}_${v.st}_${v.used}`;
        const isExhausted = v.lim > 0 && v.used >= v.lim;
        return {
          id,
          pageKey: 'vouchers',
          title: isExhausted ? `Voucher ${v.code} đã hết lượt dùng` : `Voucher ${v.code} đang tạm dừng`,
          desc: `Đã dùng ${v.used}/${v.lim} lượt`,
          time: isExhausted ? 'Hết lượt' : 'Tạm dừng',
          route: '/seller/dashboard/vouchers',
          read: !!readMap[id],
        };
      });

    const campaignNotifs: SellerPageNotificationItem[] = this.campaigns()
      .filter((c) => c.st === 'PAUSED')
      .map((c) => {
        const id = `campaign_${c.id}_${c.st}`;
        return {
          id,
          pageKey: 'campaigns',
          title: `Chiến dịch "${c.n}" đang tạm dừng`,
          desc: `${c.t} · Giảm ${c.val}${c.dt} (${c.from} đến ${c.to})`,
          time: 'Tạm dừng',
          route: '/seller/dashboard/campaigns',
          read: !!readMap[id],
        };
      });

    const reviewNotifs: SellerPageNotificationItem[] = this.reviews()
      .filter((r) => !r.re)
      .map((r) => {
        const id = `review_${r.id}`;
        return {
          id,
          pageKey: 'reviews',
          title: `Đánh giá ★${r.st} sao chưa phản hồi`,
          desc: `${r.who} (${r.p}): "${r.x || 'Khách hàng để lại đánh giá'}"`,
          time: 'Chưa phản hồi',
          route: '/seller/dashboard/reviews',
          read: !!readMap[id],
        };
      });

    const qaNotifs: SellerPageNotificationItem[] = this.questions()
      .filter((q) => !q.a)
      .map((q) => {
        const id = `qa_${q.id}`;
        return {
          id,
          pageKey: 'qa',
          title: `Câu hỏi chưa trả lời (${q.p})`,
          desc: `${q.who} hỏi: "${q.x}"`,
          time: 'Chưa trả lời',
          route: '/seller/dashboard/qa',
          read: !!readMap[id],
        };
      });

    const profileNotifs: SellerPageNotificationItem[] = [];
    const prof = this.shopProfile();
    if (!prof.ad?.trim()) {
      const id = 'profile_missing_address';
      profileNotifs.push({
        id,
        pageKey: 'profile',
        title: 'Chưa cập nhật địa chỉ kho lấy hàng',
        desc: 'Vui lòng bổ sung địa chỉ kho lấy hàng trong Hồ sơ gian hàng',
        time: 'Hồ sơ shop',
        route: '/seller/dashboard/profile',
        read: !!readMap[id],
      });
    }
    if (!prof.d?.trim()) {
      const id = 'profile_missing_desc';
      profileNotifs.push({
        id,
        pageKey: 'profile',
        title: 'Chưa có mô tả gian hàng',
        desc: 'Thêm mô tả giúp tăng độ tin cậy với khách mua hàng',
        time: 'Hồ sơ shop',
        route: '/seller/dashboard/profile',
        read: !!readMap[id],
      });
    }

    switch (page) {
      case 'orders':
        return orderNotifs;
      case 'returns':
        return returnNotifs;
      case 'products':
        return productNotifs;
      case 'inventory':
        return inventoryNotifs;
      case 'vouchers':
        return voucherNotifs;
      case 'campaigns':
        return campaignNotifs;
      case 'reviews':
        return reviewNotifs;
      case 'qa':
        return qaNotifs;
      case 'profile':
        return profileNotifs;
      default:
        // Trang Tổng quan (overview): hiển thị tổng hợp các việc cần xử lý của shop
        return [
          ...orderNotifs,
          ...returnNotifs,
          ...inventoryNotifs,
          ...reviewNotifs,
          ...qaNotifs,
        ];
    }
  });

  readonly currentPageUnreadCount = computed(
    () => this.currentPageNotifications().filter((n) => !n.read).length
  );

  setActivePageFromUrl(url: string): void {
    const clean = (url || '').split('?')[0].split('#')[0];
    if (clean.includes('/seller/dashboard/orders')) {
      this.activePageKey.set('orders');
    } else if (clean.includes('/seller/dashboard/returns')) {
      this.activePageKey.set('returns');
    } else if (clean.includes('/seller/dashboard/products')) {
      this.activePageKey.set('products');
    } else if (clean.includes('/seller/dashboard/inventory')) {
      this.activePageKey.set('inventory');
    } else if (clean.includes('/seller/dashboard/vouchers')) {
      this.activePageKey.set('vouchers');
    } else if (clean.includes('/seller/dashboard/campaigns')) {
      this.activePageKey.set('campaigns');
    } else if (clean.includes('/seller/dashboard/reviews')) {
      this.activePageKey.set('reviews');
    } else if (clean.includes('/seller/dashboard/qa')) {
      this.activePageKey.set('qa');
    } else if (clean.includes('/seller/dashboard/profile')) {
      this.activePageKey.set('profile');
    } else {
      this.activePageKey.set('overview');
    }
  }

  markNotificationRead(id: string): void {
    this.readNotificationIds.update((prev) => ({ ...prev, [id]: true }));
  }

  markCurrentPageNotificationsRead(): void {
    const currentList = this.currentPageNotifications();
    if (currentList.length === 0) return;
    this.readNotificationIds.update((prev) => {
      const next = { ...prev };
      for (const item of currentList) {
        next[item.id] = true;
      }
      return next;
    });
  }

  setShopProfile(raw: any): void {
    const p = raw?.data || raw;
    if (!p) return;
    this.shopProfile.set({
      n: p.n ?? p.shopName ?? p.name ?? '',
      d: p.d ?? p.description ?? p.tagline ?? '',
      ph: p.ph ?? p.phone ?? '',
      em: p.em ?? p.email ?? '',
      ad: p.ad ?? p.pickupAddress ?? '',
      hr: p.hr ?? p.businessHours ?? '08:00 – 21:00',
      logo: p.logo ?? p.logoUrl ?? '',
      banner: p.banner ?? p.bannerUrl ?? '',
    });
  }

  setOrders(rawList: any[]): void {
    if (!Array.isArray(rawList)) {
      this.orders.set([]);
      return;
    }
    const mapped: OrderItem[] = rawList.map((item: any) => {
      let rawStatus = item.status || item.s || 'PENDING';
      if (rawStatus === 'CONFIRMED' || rawStatus === 'PENDING_PACKAGING') {
        rawStatus = 'PREPARING';
      } else if (rawStatus === 'PENDING_CONFIRMATION') {
        rawStatus = 'PENDING';
      } else if (rawStatus === 'SHIPPING') {
        rawStatus = 'READY_TO_SHIP';
      } else if (rawStatus === 'CANCELLED') {
        rawStatus = 'REJECTED';
      }
      return {
        c: item.orderCode || item.code || item.c || `VM${item.id}`,
        n: item.customerName || item.n || 'Khách hàng',
        k: item.itemCount ?? item.k ?? 1,
        t: Number(item.totalAmount ?? item.t ?? 0),
        s: rawStatus as OrderItem['s'],
        h: item.time || item.createdAt || item.h || 'Vừa xong',
        d: item.daysAgo ?? item.d ?? 0,
      };
    });
    this.orders.set(mapped);
  }

  setReturns(rawList: any[]): void {
    if (!Array.isArray(rawList)) {
      this.returns.set([]);
      return;
    }
    const mapped: ReturnItem[] = rawList.map((item: any) => ({
      id: item.id,
      o: item.orderCode || item.o || '',
      n: item.customerName || item.n || 'Khách hàng',
      type: item.type || 'Trả hàng hoàn tiền',
      why: item.reason || item.why || '',
      amt: Number(item.amount ?? item.amt ?? 0),
      img: item.imageCount ?? item.img ?? 0,
      st: (item.status || item.st || 'PENDING') as ReturnItem['st'],
      re: item.reply || item.re,
    }));
    this.returns.set(mapped);
  }

  setReviews(rawList: any[]): void {
    if (!Array.isArray(rawList)) {
      this.reviews.set([]);
      return;
    }
    const mapped: ReviewItem[] = rawList.map((item: any) => ({
      id: item.id,
      p: item.productName || item.productTitle || item.p || 'Sản phẩm',
      who: item.customerName || item.userName || item.who || 'Khách hàng',
      st: Number(item.rating ?? item.st ?? 5),
      x: item.content ?? item.comment ?? item.x ?? '',
      re: item.reply || item.re || undefined,
    }));
    this.reviews.set(mapped);
  }

  setQuestions(rawList: any[]): void {
    if (!Array.isArray(rawList)) {
      this.questions.set([]);
      return;
    }
    const mapped: QuestionItem[] = rawList.map((item: any) => ({
      id: item.id,
      p: item.productName || item.productTitle || item.p || 'Sản phẩm',
      who: item.customerName || item.userName || item.who || 'Khách hàng',
      x: item.content ?? item.question ?? item.x ?? '',
      a: item.answer || item.reply || item.a || undefined,
    }));
    this.questions.set(mapped);
  }

  setVouchers(rawList: any[]): void {
    if (!Array.isArray(rawList)) {
      this.vouchers.set([]);
      return;
    }
    const mapped: VoucherItem[] = rawList.map((item: any) => ({
      id: item.id,
      code: item.code,
      t: (item.discountType || item.t || 'PERCENT') as 'PERCENT' | 'FIXED',
      val: item.value != null ? Number(item.value) : (item.val || 0),
      max: item.maxDiscount != null ? Number(item.maxDiscount) : (item.max || 0),
      min: item.minOrderAmount != null ? Number(item.minOrderAmount) : (item.min || 0),
      lim: item.usageLimit || item.lim || 100,
      used: item.usedCount || item.used || 0,
      from: item.startAt ? item.startAt.split('T')[0] : (item.from || ''),
      to: item.endAt ? item.endAt.split('T')[0] : (item.to || ''),
      st: (item.status || item.st || 'ACTIVE') as VoucherItem['st'],
    }));
    this.vouchers.set(mapped);
  }

  setCampaigns(rawList: any[]): void {
    if (!Array.isArray(rawList)) {
      this.campaigns.set([]);
      return;
    }
    const mapped: CampaignItem[] = rawList.map((item: any) => ({
      id: item.id,
      n: item.name || item.n || 'Chương trình giảm giá',
      t: item.type === 'COMBO' ? 'Combo / mua kèm' : 'Flash sale',
      from: item.startAt ? item.startAt.split('T')[0] : (item.from || ''),
      to: item.endAt ? item.endAt.split('T')[0] : (item.to || ''),
      dt: '%',
      val: Number(item.discountPercent ?? item.val ?? 10),
      quota: Number(item.quota ?? 100),
      k: Number(item.productCount ?? item.k ?? 0),
      st: (item.status || item.st || 'ACTIVE') as 'ACTIVE' | 'PAUSED' | 'ENDED',
    }));
    this.campaigns.set(mapped);
  }

  // Toast actions
  showToast(msg: string, isError: boolean = false): void {
    this.isToastError.set(isError);
    this.toastMessage.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 2800);
  }
}
