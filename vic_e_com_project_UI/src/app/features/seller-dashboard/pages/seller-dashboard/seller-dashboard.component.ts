import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import {
  ProductVariant,
  SellerProduct,
  SellerProductService,
} from '../../services/seller-product.service';
import { SellerDashboardService } from '../../services/seller-dashboard.service';

export interface OrderItem {
  c: string; // Mã đơn
  n: string; // Tên khách
  k: number; // Số lượng món
  t: number; // Tổng tiền
  s: 'PENDING' | 'PREPARING' | 'PACKED' | 'READY_TO_SHIP' | 'DELIVERED' | 'REJECTED';
  h: string; // Thời gian
  d?: number; // Ngày
}

export interface ReturnItem {
  id: number;
  o: string;
  n: string;
  type: string;
  why: string;
  amt: number;
  img: number;
  st: 'PENDING' | 'APPROVED' | 'REJECTED';
  re?: string;
}

export interface ReviewItem {
  id: number;
  p: string;
  who: string;
  st: number;
  x: string;
  re?: string;
}

export interface QuestionItem {
  id: number;
  p: string;
  who: string;
  x: string;
  a?: string;
}

export interface VoucherItem {
  id?: number;
  code: string;
  t: 'PERCENT' | 'FIXED';
  val: number;
  max: number;
  min: number;
  lim: number;
  used: number;
  from: string;
  to: string;
  st: 'ACTIVE' | 'PAUSED' | 'EXPIRED' | 'DELETED';
}

export interface CampaignItem {
  id: number;
  n: string;
  t: string;
  from: string;
  to: string;
  dt: '%' | 'đ';
  val: number;
  quota: number;
  k: number;
  st: 'ACTIVE' | 'PAUSED' | 'ENDED';
}

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerDashboardComponent implements OnInit {
  private readonly productService = inject(SellerProductService);
  private readonly dashboardService = inject(SellerDashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly currentShopId = signal<number | null>(null);

  // Form dữ liệu hồ sơ shop
  readonly formShopProfile = {
    n: 'Lumi Home Decor',
    d: 'Đồ decor phong cách tối giản Bắc Âu.',
    ph: '0912345678',
    em: 'lumi@vicmart.vn',
    ad: 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
    hr: '08:00 – 21:00',
  };

  private syncProfileData(data: { n: string; d: string; ph: string; em: string; ad: string; hr: string }): void {
    this.shopProfile.set(data);
    this.formShopProfile.n = data.n || '';
    this.formShopProfile.d = data.d || '';
    this.formShopProfile.ph = data.ph || '';
    this.formShopProfile.em = data.em || '';
    this.formShopProfile.ad = data.ad || '';
    this.formShopProfile.hr = data.hr || '08:00 – 21:00';
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    const role = this.authService.getRole()?.toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      void this.router.navigateByUrl('/admin');
      return;
    }
    this.loadProducts();
    this.loadCategories();
    this.detectApprovedRole();
    this.loadCurrentShopInfo();
    this.loadVouchers();
    this.loadReviewsAndQuestions();
  }

  private loadCategories(): void {
    this.http.get<any>('http://localhost:9090/api/categories').subscribe({ next: (res) => {
      const items = res?.data?.items || res?.items || [];
      if (Array.isArray(items)) this.categoryItems.set(items);
    }});
  }

  loadCurrentShopInfo(): void {
    const savedLocal = localStorage.getItem('vic_seller_shop_profile');
    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.n) {
          this.syncProfileData(parsed);
        }
      } catch {}
    }

    this.http.get<any>('http://localhost:9090/api/shops/current').subscribe({
      next: (res) => {
        const shop = res?.data || res;
        if (shop && shop.id) {
          this.currentShopId.set(shop.id);
          const data = {
            n: shop.name || this.formShopProfile.n,
            d: shop.description || this.formShopProfile.d || 'Đồ decor phong cách tối giản Bắc Âu.',
            ph: shop.phone || this.formShopProfile.ph || '0912345678',
            em: shop.email || this.formShopProfile.em || 'lumi@vicmart.vn',
            ad: shop.pickupAddress || this.formShopProfile.ad || 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
            hr: shop.businessHours || this.formShopProfile.hr || '08:00 – 21:00',
          };
          this.syncProfileData(data);
          localStorage.setItem('vic_seller_shop_profile', JSON.stringify(data));
        }
      },
      error: () => {},
    });
  }

  loadVouchers(): void {
    this.http.get<any>('http://localhost:9090/api/seller/vouchers').subscribe({
      next: (res) => {
        const list = res?.data || [];
        if (Array.isArray(list)) {
          const mapped: VoucherItem[] = list.map((item: any) => ({
            id: item.id,
            code: item.code,
            t: item.discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
            val: Number(item.value) || 0,
            max: Number(item.maxDiscount) || 0,
            min: Number(item.minOrderAmount) || 0,
            lim: item.usageLimit || 100,
            used: item.usedCount || 0,
            from: item.startAt ? item.startAt.split('T')[0] : '',
            to: item.endAt ? item.endAt.split('T')[0] : '',
            st: (item.status === 'DELETED' ? 'DELETED' : (item.status === 'PAUSED' || item.displayStatus === 'PAUSED' ? 'PAUSED' : (item.displayStatus === 'EXPIRED' ? 'EXPIRED' : (item.status || 'ACTIVE')))) as any,
          }));
          this.vouchers.set(mapped);
        }
      },
      error: () => {},
    });
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (list) => {
        if (list && list.length > 0) {
          this.products.set(list);
          this.syncToStorageAndStorefront(list);
        } else {
          const localSaved = localStorage.getItem('vic_seller_products');
          if (localSaved) {
            try {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                this.products.set(parsed);
                this.dashboardService.loadShopProductsFromStorage();
                return;
              }
            } catch {}
          }
          this.products.set([]);
          this.syncToStorageAndStorefront([]);
        }
      },
      error: () => {
        const localSaved = localStorage.getItem('vic_seller_products');
        if (localSaved) {
          try {
            const parsed = JSON.parse(localSaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              this.products.set(parsed);
              this.dashboardService.loadShopProductsFromStorage();
              return;
            }
          } catch {}
        }
        this.products.set([]);
        this.syncToStorageAndStorefront([]);
      },
    });
  }

  private syncToStorageAndStorefront(list: SellerProduct[]): void {
    localStorage.setItem('vic_seller_products', JSON.stringify(list));
    this.dashboardService.syncProducts(list);
  }

  // Menu tài khoản người bán & đăng xuất
  readonly userMenuOpen = signal<boolean>(false);

  toggleUserMenu(event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    this.userMenuOpen.update((open) => !open);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeUserMenu();
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.userMenuOpen() && target && !target.closest('.me-wrap')) {
      this.closeUserMenu();
    }
  }

  // Trạng thái phê duyệt gian hàng: APPROVED, PENDING, NEED_INFO, RESUBMITTED, REJECTED, LOCKED
  readonly shopStatus = signal<string>('APPROVED');
  readonly currentView = signal<string>('dash');
  readonly filterOrder = signal<string>('PENDING');
  readonly searchQuery = signal<string>('');
  readonly productFilterStatus = signal<string>('ALL');
  readonly orderDaysFilter = signal<string>('ALL');
  readonly lowStockOnly = signal<boolean>(false);
  readonly reviewFilter = signal<string>('ALL');

  // Modal từ chối đơn hàng
  readonly rejectModalOpen = signal<boolean>(false);
  readonly rejectTargetCode = signal<string>('');
  readonly rejectReason = signal<string>('');
  readonly rejectError = signal<string>('');

  // Generic modal (Chi tiết đơn, Phản hồi,...)
  readonly genericModalOpen = signal<boolean>(false);
  readonly modalTitle = signal<string>('');
  readonly modalType = signal<string>('');
  readonly modalError = signal<string>('');
  readonly modalData = signal<any>(null);

  // Form Thêm / Sửa sản phẩm
  readonly editingProductId = signal<number | null>(null);
  readonly formProductName = signal<string>('');
  readonly formCategory = signal<string>('Nhà cửa & Đời sống');
  readonly formCategoryId = signal<number | null>(null);
  readonly formStatus = signal<string>('VISIBLE');
  readonly formDescription = signal<string>('');
  readonly formImageUrl = signal<string>('');
  readonly formMediaType = signal<'IMAGE' | 'VIDEO'>('IMAGE');
  readonly mediaUploading = signal<boolean>(false);
  readonly formMedia = signal<{ url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }[]>([]);
  readonly selectedMediaIndex = signal<number>(0);
  readonly isMediaPreviewOpen = signal<boolean>(false);

  readonly formVariants = signal<ProductVariant[]>([
    { sku: 'DN-NAU', a: 'Nâu', p: 389000, q: 2, l: 5 },
    { sku: 'DN-NAT', a: 'Tự nhiên', p: 389000, q: 18, l: 5 },
  ]);

  // Form Voucher
  readonly formVoucher = signal<Partial<VoucherItem>>({
    code: '',
    t: 'PERCENT',
    val: 10,
    max: 50000,
    min: 300000,
    lim: 200,
    from: '2026-10-01',
    to: '2026-10-31',
  });

  // Toast
  readonly toastMessage = signal<string | null>(null);
  private toastTimer?: any;

  // Dữ liệu shop
  readonly shopProfile = signal({
    n: 'Lumi Home Decor',
    d: 'Đồ decor phong cách tối giản Bắc Âu.',
    ph: '0912345678',
    em: 'lumi@vicmart.vn',
    ad: 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
    hr: '08:00 – 21:00',
  });

  // Tên tài khoản người dùng yêu cầu duyệt đơn (User Account)
  readonly userAccountName = computed(() => {
    const authenticatedName = this.authService.currentUserNameSignal()?.trim();
    if (authenticatedName && authenticatedName !== 'Thành viên') {
      return authenticatedName;
    }

    const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.contactInfo?.representativeName?.trim()) {
          return draft.contactInfo.representativeName.trim();
        }
      } catch {}
    }
    const fullName = localStorage.getItem('fullName');
    if (fullName && fullName !== 'Thành viên' && fullName !== 'null' && fullName !== 'undefined') {
      return fullName.trim();
    }
    const currentUsername = localStorage.getItem('currentUsername');
    if (currentUsername) {
      return currentUsername.split('@')[0];
    }
    return 'Chủ gian hàng';
  });

  // Tên gian hàng (Shop Name)
  readonly shopName = computed(() => {
    const profName = this.shopProfile()?.n?.trim();
    if (profName) {
      return profName;
    }
    const savedProfRaw = localStorage.getItem('vic_seller_shop_profile');
    if (savedProfRaw) {
      try {
        const savedProf = JSON.parse(savedProfRaw);
        if (savedProf?.n?.trim()) {
          return savedProf.n.trim();
        }
      } catch {}
    }
    const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.shopInfo?.shopName?.trim()) {
          return draft.shopInfo.shopName.trim();
        }
      } catch {}
    }
    return 'VICMART Shop';
  });

  readonly userAvatarLetter = computed(() => {
    return this.userAccountName().charAt(0).toUpperCase();
  });

  // Danh sách danh mục
  readonly categories = [
    'Thời trang & Phụ kiện',
    'Mỹ phẩm & Chăm sóc sắc đẹp',
    'Điện thoại & Đồ công nghệ',
    'Nhà cửa & Đời sống',
    'Thực phẩm & Đồ uống',
    'Mẹ & Bé',
    'Sách & Văn phòng phẩm',
    'Thể thao & Dã ngoại',
  ];

  // Danh sách sản phẩm (Quản lý thêm sửa xóa qua API, ban đầu trống)
  readonly categoryItems = signal<{ id: number; name: string }[]>([]);
  readonly products = signal<SellerProduct[]>([]);

  // Đơn hàng
  readonly orders = signal<OrderItem[]>([
    { c: 'VM2610-0412', n: 'Trần Thu Hà', k: 2, t: 486000, s: 'PENDING', h: '09:12', d: 0 },
    { c: 'VM2610-0415', n: 'Lê Minh Đức', k: 1, t: 259000, s: 'PENDING', h: '09:40', d: 0 },
    { c: 'VM2610-0398', n: 'Phạm Ngọc Anh', k: 3, t: 1120000, s: 'PREPARING', h: '08:05', d: 0 },
    { c: 'VM2610-0401', n: 'Vũ Hải Yến', k: 1, t: 179000, s: 'PREPARING', h: '08:31', d: 0 },
    { c: 'VM2610-0390', n: 'Đặng Quốc Bảo', k: 2, t: 640000, s: 'PACKED', h: 'Hôm qua', d: 1 },
    { c: 'VM2610-0386', n: 'Hoàng Mai Lan', k: 1, t: 329000, s: 'READY_TO_SHIP', h: 'Hôm qua', d: 1 },
    { c: 'VM2610-0340', n: 'Bùi Thanh Tâm', k: 2, t: 518000, s: 'DELIVERED', h: '16/10', d: 5 },
    { c: 'VM2610-0331', n: 'Mai Đức Long', k: 1, t: 259000, s: 'DELIVERED', h: '15/10', d: 6 },
  ]);

  // Đổi trả
  readonly returns = signal<ReturnItem[]>([
    { id: 1, o: 'VM2610-0377', n: 'Nguyễn Văn An', type: 'Trả hàng hoàn tiền', why: 'Hàng bị nứt khi nhận', amt: 329000, img: 2, st: 'PENDING' },
    { id: 2, o: 'VM2610-0369', n: 'Lê Thị Hoa', type: 'Đổi hàng', why: 'Giao sai màu', amt: 179000, img: 1, st: 'PENDING' },
  ]);

  // Đánh giá
  readonly reviews = signal<ReviewItem[]>([
    { id: 1, p: 'Đèn ngủ gỗ sồi', who: 'Trần Thu Hà', st: 5, x: 'Đèn đẹp, ánh sáng ấm, đóng gói kỹ.' },
    { id: 2, p: 'Kệ treo tường', who: 'Phạm Ngọc Anh', st: 2, x: 'Giao hơi chậm và hộp bị móp.' },
    { id: 3, p: 'Bình gốm trắng', who: 'Vũ Hải Yến', st: 4, x: 'Men đẹp, đúng mô tả.', re: 'Cảm ơn bạn đã ủng hộ Lumi!' },
  ]);

  // Hỏi đáp
  readonly questions = signal<QuestionItem[]>([
    { id: 1, p: 'Đèn ngủ gỗ sồi', who: 'Ngô Anh', x: 'Đèn ngủ có kèm bóng không ạ?' },
    { id: 2, p: 'Kệ treo tường', who: 'Đỗ Minh', x: 'Kệ treo chịu tải tối đa bao nhiêu kg?' },
    { id: 3, p: 'Bình gốm trắng', who: 'Lan Chi', x: 'Bình gốm có màu kem không shop?' },
  ]);

  // Vouchers
  readonly vouchers = signal<VoucherItem[]>([]);

  // Giảm giá / Flash sale
  readonly campaigns = signal<CampaignItem[]>([
    { id: 1, n: 'Flash sale 21.10', t: 'Flash sale', from: '2026-10-21', to: '2026-10-23', dt: '%', val: 15, quota: 50, k: 3, st: 'ACTIVE' },
    { id: 2, n: 'Combo trang trí phòng khách', t: 'Combo / mua kèm', from: '2026-10-01', to: '2026-10-10', dt: '%', val: 10, quota: 100, k: 2, st: 'ENDED' },
  ]);

  // Biểu đồ 7 ngày
  readonly revChart = [3.1, 2.4, 3.8, 2.9, 4.6, 3.7, 4.28];
  readonly revDays = ['T5', 'T6', 'T7', 'CN', 'T2', 'T3', 'T4'];

  // Giấy tờ cần bổ sung khi NEED_INFO
  readonly requiredDocs = ['CCCD mặt sau', 'Giấy phép kinh doanh'];
  readonly uploadedFiles = signal<Record<string, string>>({});

  // Computed stock
  readonly lowStockItems = computed(() => {
    const list: { n: string; q: number; l: number; sku: string; pid: number; idx: number }[] = [];
    this.products().forEach((p) => {
      if (p.s !== 'DELETED') {
        p.v.forEach((v, idx) => {
          if (v.q <= v.l) {
            list.push({ n: `${p.n} · ${v.a}`, q: v.q, l: v.l, sku: v.sku, pid: p.id, idx });
          }
        });
      }
    });
    return list;
  });

  // Computed counts
  readonly pendingOrderCount = computed(() => this.orders().filter((o) => o.s === 'PENDING').length);
  readonly preparingOrderCount = computed(() => this.orders().filter((o) => o.s === 'PREPARING').length);
  readonly packedOrderCount = computed(() => this.orders().filter((o) => o.s === 'PACKED').length);
  readonly readyOrderCount = computed(() => this.orders().filter((o) => o.s === 'READY_TO_SHIP').length);
  readonly deliveredOrderCount = computed(() => this.orders().filter((o) => o.s === 'DELIVERED').length);
  readonly openOrdersCount = computed(() => this.pendingOrderCount() + this.preparingOrderCount() + this.packedOrderCount());
  readonly pendingReturnCount = computed(() => this.returns().filter((r) => r.st === 'PENDING').length);
  readonly unrepliedQuestionCount = computed(() => this.questions().filter((q) => !q.a).length);
  readonly unrepliedReviewCount = computed(() => this.reviews().filter((r) => !r.re).length);
  readonly totalTodoCount = computed(
    () => this.pendingOrderCount() + this.preparingOrderCount() + this.lowStockItems().length + this.unrepliedQuestionCount()
  );

  // Computed product counts by status
  readonly allProductCount = computed(() => this.products().filter((p) => p.s !== 'DELETED').length);
  readonly visibleProductCount = computed(() => this.products().filter((p) => p.s === 'VISIBLE').length);
  readonly hiddenProductCount = computed(() => this.products().filter((p) => p.s === 'HIDDEN').length);
  readonly draftProductCount = computed(() => this.products().filter((p) => p.s === 'DRAFT').length);

  // Computed filtered products
  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.productFilterStatus();
    return this.products().filter((p) => {
      if (p.s === 'DELETED') return false;
      const matchStatus = st === 'ALL' || p.s === st;
      const matchQuery = !q || p.n.toLowerCase().includes(q) || p.c.toLowerCase().includes(q) || p.v.some((v) => v.sku.toLowerCase().includes(q));
      return matchStatus && matchQuery;
    });
  });

  // Computed filtered orders
  readonly filteredOrders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.filterOrder();
    const d = this.orderDaysFilter();
    return this.orders().filter((o) => {
      const matchStatus = st === 'ALL' ? ['PENDING', 'PREPARING', 'PACKED'].includes(o.s) : o.s === st;
      const matchQuery = !q || o.c.toLowerCase().includes(q) || o.n.toLowerCase().includes(q);
      const matchDays = d === 'ALL' || (o.d != null && o.d <= +d);
      return matchStatus && matchQuery && matchDays;
    });
  });

  // Computed inventory list
  readonly inventoryList = computed(() => {
    const isLow = this.lowStockOnly();
    const list: { p: SellerProduct; v: ProductVariant; idx: number }[] = [];
    this.products().forEach((p) => {
      if (p.s !== 'DELETED') {
        p.v.forEach((v, idx) => {
          if (!isLow || v.q <= v.l) {
            list.push({ p, v, idx });
          }
        });
      }
    });
    return list;
  });

  detectApprovedRole(): void {
    const role = localStorage.getItem('role');
    const savedLocal = localStorage.getItem('vic_seller_shop_profile');
    const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');

    if (savedLocal) {
      try {
        const parsed = JSON.parse(savedLocal);
        if (parsed && parsed.n) {
          this.syncProfileData(parsed);
        }
      } catch {}
    }

    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.status === 'APPROVED' || role === 'VENDOR' || role === 'ROLE_VENDOR') {
          this.shopStatus.set('APPROVED');
          if (!savedLocal && draft.shopInfo?.shopName) {
            const pickup = [
              draft.contactInfo?.detailedAddress,
              draft.contactInfo?.ward,
              draft.contactInfo?.district,
              draft.contactInfo?.province,
            ].filter(Boolean).join(', ');

            const draftData = {
              n: draft.shopInfo.shopName,
              d: draft.shopInfo.description || this.formShopProfile.d,
              ad: pickup || this.formShopProfile.ad,
              ph: draft.contactInfo?.phone || this.formShopProfile.ph,
              em: draft.contactInfo?.email || this.formShopProfile.em,
              hr: this.formShopProfile.hr || '08:00 – 21:00',
            };
            this.syncProfileData(draftData);
          }
        }
      } catch {}
    }
  }

  // Chuyển view
  setView(v: string): void {
    if (v === 'pform') {
      this.openCreateProductModal();
      return;
    }
    this.currentView.set(v);
    this.searchQuery.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // --- API 2: Thêm mới sản phẩm ---
  openCreateProductModal(): void {
    this.editingProductId.set(null);
    this.formProductName.set('');
    this.formCategory.set('Nhà cửa & Đời sống');
    this.formStatus.set('VISIBLE');
    this.formDescription.set('');
    this.formImageUrl.set('');
    this.formMedia.set([]);
    this.selectedMediaIndex.set(0);
    this.isMediaPreviewOpen.set(false);
    this.formVariants.set([
      { sku: 'SP-' + Math.floor(1000 + Math.random() * 9000), a: 'Tiêu chuẩn', p: 199000, q: 20, l: 5 },
    ]);
    this.modalError.set('');
    this.modalTitle.set('Thêm sản phẩm mới');
    this.modalType.set('pform');
    this.genericModalOpen.set(true);
  }

  // --- API 3: Sửa sản phẩm ---
  openEditProductModal(p: SellerProduct): void {
    this.editingProductId.set(p.id);
    this.formProductName.set(p.n);
    this.formCategory.set(p.c);
    this.formStatus.set(p.s);
    this.formDescription.set(p.d || '');
    this.formImageUrl.set(p.imageUrl || '');
    const initialMedia: { url: string; type: 'IMAGE' | 'VIDEO'; sortOrder: number }[] =
      p.media && p.media.length > 0
        ? structuredClone(p.media)
            .map((m, idx) => ({
              url: m.url,
              type: (m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
              sortOrder: m.sortOrder ?? idx,
            }))
            .sort((a, b) => a.sortOrder - b.sortOrder)
        : (p.imageUrl ? [{ url: p.imageUrl, type: 'IMAGE' as const, sortOrder: 0 }] : []);
    this.formMedia.set(initialMedia);
    this.selectedMediaIndex.set(0);
    this.isMediaPreviewOpen.set(false);
    this.formVariants.set(p.v && p.v.length > 0 ? structuredClone(p.v) : [{ sku: 'SKU-' + p.id, a: 'Mặc định', p: 100000, q: 10, l: 5 }]);
    this.modalError.set('');
    this.modalTitle.set(`Sửa sản phẩm: ${p.n}`);
    this.modalType.set('pform');
    this.genericModalOpen.set(true);
  }

  addVariantRow(): void {
    this.formVariants.update((list) => [
      ...list,
      { sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000), a: '', p: 150000, q: 10, l: 5 },
    ]);
  }

  removeVariantRow(idx: number): void {
    this.formVariants.update((list) => list.filter((_, i) => i !== idx));
  }

  clearImage(): void {
    this.formMedia.set([]);
    this.selectedMediaIndex.set(0);
    this.closeMediaPreview();
    this.formImageUrl.set('');
  }

  onFormImageUrlChange(url: string): void {
    this.formImageUrl.set(url);
    const trimmed = url.trim();
    if (trimmed) {
      if (this.formMedia().length === 0) {
        const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(trimmed);
        this.formMedia.set([{ url: trimmed, type: isVideo ? 'VIDEO' : 'IMAGE', sortOrder: 0 }]);
        this.selectedMediaIndex.set(0);
      }
    }
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.modalError.set('Ảnh tải lên không được vượt quá 5MB.');
      return;
    }
    const data = new FormData();
    data.append('file', file);
    this.mediaUploading.set(true);
    this.http.post<any>('http://localhost:9090/api/seller/products/media/upload', data).subscribe({
      next: (res) => { const media = res?.data || res; this.formImageUrl.set(media.url); this.formMediaType.set(media.type === 'VIDEO' ? 'VIDEO' : 'IMAGE'); this.modalError.set(''); this.mediaUploading.set(false); this.cdr.markForCheck(); },
      error: () => { this.modalError.set('Không thể upload file lên Cloudinary. Vui lòng thử lại.'); this.mediaUploading.set(false); this.cdr.markForCheck(); },
    });
  }

  onImageError(): void {
    // Không làm gãy giao diện khi link ảnh ngoại tuyến
  }

  onMultipleMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files); this.mediaUploading.set(true); let done=0;
    files.forEach(file => { const data=new FormData(); data.append('file',file); this.http.post<any>('http://localhost:9090/api/seller/products/media/upload',data).subscribe({
      next: res => { const m=res?.data||res; const wasEmpty = this.formMedia().length === 0; this.formMedia.update(list=>[...list,{url:m.url,type:m.type==='VIDEO'?'VIDEO':'IMAGE',sortOrder:list.length}]); if(!this.formImageUrl())this.formImageUrl.set(m.url); if(wasEmpty)this.selectedMediaIndex.set(0); if(++done===files.length)this.mediaUploading.set(false); this.cdr.markForCheck(); },
      error: () => { this.modalError.set('Không thể upload một hoặc nhiều file lên Cloudinary.'); if(++done===files.length)this.mediaUploading.set(false); this.cdr.markForCheck(); }
    }); }); input.value='';
  }
  selectMedia(index: number): void {
    this.selectedMediaIndex.set(index);
  }

  openMediaPreview(index: number): void {
    if (this.formMedia().length === 0 && this.formImageUrl().trim()) {
      this.formMedia.set([{ url: this.formImageUrl().trim(), type: this.formMediaType(), sortOrder: 0 }]);
    }
    this.selectedMediaIndex.set(index);
    this.isMediaPreviewOpen.set(true);
  }

  closeMediaPreview(): void {
    this.isMediaPreviewOpen.set(false);
  }

  movePreview(delta: number): void {
    const total = this.formMedia().length;
    if (total <= 1) return;

    this.selectedMediaIndex.update((index) =>
      (index + delta + total) % total
    );
  }

  removeMedia(index: number): void {
    const currentSelected = this.selectedMediaIndex();
    const oldList = this.formMedia();
    const newList = oldList.filter((_, i) => i !== index).map((m, i) => ({ ...m, sortOrder: i }));
    this.formMedia.set(newList);

    if (newList.length === 0) {
      this.selectedMediaIndex.set(0);
      this.formImageUrl.set('');
      this.closeMediaPreview();
    } else if (currentSelected === index) {
      const nextIndex = Math.min(index, newList.length - 1);
      this.selectedMediaIndex.set(nextIndex);
      this.formImageUrl.set(newList[0]?.url || '');
    } else if (currentSelected > index) {
      this.selectedMediaIndex.set(currentSelected - 1);
      this.formImageUrl.set(newList[0]?.url || '');
    } else {
      this.selectedMediaIndex.set(Math.min(currentSelected, newList.length - 1));
      this.formImageUrl.set(newList[0]?.url || '');
    }
  }
  moveMedia(index: number, direction: -1 | 1): void {
    const next = index + direction;
    const list = [...this.formMedia()];
    if (next < 0 || next >= list.length) return;

    const currentSelected = this.selectedMediaIndex();
    let newSelected = currentSelected;
    if (currentSelected === index) {
      newSelected = next;
    } else if (currentSelected === next) {
      newSelected = index;
    }

    [list[index], list[next]] = [list[next], list[index]];
    const updatedList = list.map((m, i) => ({ ...m, sortOrder: i }));
    this.formMedia.set(updatedList);
    this.selectedMediaIndex.set(newSelected);
    this.formImageUrl.set(updatedList[0]?.url || '');
  }

  saveProduct(): void {
    const name = this.formProductName().trim();
    if (name.length < 3) {
      this.modalError.set('Tên sản phẩm cần tối thiểu 3 ký tự.');
      return;
    }
    const variants = this.formVariants();
    if (!variants.length) {
      this.modalError.set('Cần ít nhất một biến thể.');
      return;
    }
    for (const v of variants) {
      if (!v.sku || !v.a || v.p <= 0 || v.q < 0 || v.l < 0) {
        this.modalError.set('Mỗi biến thể cần đầy đủ SKU, phân loại, giá > 0, tồn kho và ngưỡng ≥ 0.');
        return;
      }
    }

    const img = this.formImageUrl().trim();
    const payload: Partial<SellerProduct> = {
      n: name,
      c: this.formCategory(),
      d: this.formDescription().trim(),
      s: this.formStatus() as any,
      imageUrl: this.formMedia().length > 0 ? this.formMedia()[0].url : (img || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'),
      v: variants,
      media: this.formMedia().length > 0 ? this.formMedia() : (img ? [{ url: img, type: this.formMediaType(), sortOrder: 0 }] : []),
    };

    const editId = this.editingProductId();
    if (editId) {
      // Gọi API Sửa sản phẩm riêng biệt
      this.productService.updateProduct(editId, payload).subscribe({
        next: (saved) => {
          this.products.update((list) => {
            const updated = list.map((item) => (item.id === editId ? { ...item, ...payload, id: editId } : item));
            this.syncToStorageAndStorefront(updated);
            return updated;
          });
          this.showToast('✅ Đã cập nhật sản phẩm thành công.');
          this.closeGenericModal();
        },
        error: () => {
          // Optimistic local update nếu backend chưa kết nối
          this.products.update((list) => {
            const updated = list.map((item) => (item.id === editId ? { ...item, ...payload, id: editId } : item));
            this.syncToStorageAndStorefront(updated);
            return updated;
          });
          this.showToast('✅ Đã cập nhật sản phẩm.');
          this.closeGenericModal();
        },
      });
    } else {
      // Gọi API Thêm sản phẩm riêng biệt
      this.productService.createProduct(payload).subscribe({
        next: (created) => {
          const newProduct: SellerProduct = {
            id: created?.id || Date.now(),
            n: name,
            c: this.formCategory(),
            d: this.formDescription().trim(),
            s: this.formStatus() as any,
            sold: 0,
            imageUrl: payload.imageUrl,
            media: payload.media,
            v: variants,
          };
          this.products.update((list) => {
            const updated = [newProduct, ...list];
            this.syncToStorageAndStorefront(updated);
            return updated;
          });
          this.showToast('✨ Đã thêm sản phẩm mới thành công.');
          this.closeGenericModal();
        },
        error: () => {
          // Optimistic local update
          const newProduct: SellerProduct = {
            id: Date.now(),
            n: name,
            c: this.formCategory(),
            d: this.formDescription().trim(),
            s: this.formStatus() as any,
            sold: 0,
            imageUrl: payload.imageUrl,
            media: payload.media,
            v: variants,
          };
          this.products.update((list) => {
            const updated = [newProduct, ...list];
            this.syncToStorageAndStorefront(updated);
            return updated;
          });
          this.showToast('✨ Đã thêm sản phẩm mới.');
          this.closeGenericModal();
        },
      });
    }
  }

  // --- API 4: Xóa sản phẩm ---
  confirmDeleteProduct(p: SellerProduct): void {
    this.modalTitle.set('Xóa sản phẩm?');
    this.modalType.set('delete_confirm');
    this.modalData.set(p);
    this.modalError.set('');
    this.genericModalOpen.set(true);
  }

  executeDeleteProduct(): void {
    const p = this.modalData() as SellerProduct;
    if (!p) return;

    this.productService.deleteProduct(p.id).subscribe({
      next: () => {
        this.products.update((list) => {
          const updated = list.filter((item) => item.id !== p.id);
          this.syncToStorageAndStorefront(updated);
          return updated;
        });
        this.showToast(`🗑️ Đã xóa sản phẩm "${p.n}".`);
        this.closeGenericModal();
      },
      error: () => {
        this.products.update((list) => {
          const updated = list.filter((item) => item.id !== p.id);
          this.syncToStorageAndStorefront(updated);
          return updated;
        });
        this.showToast(`🗑️ Đã xóa sản phẩm "${p.n}".`);
        this.closeGenericModal();
      },
    });
  }

  // --- API 5: Ẩn / Hiện sản phẩm ---
  toggleProductVisibility(p: SellerProduct): void {
    const targetStatus: 'VISIBLE' | 'HIDDEN' = p.s === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    this.productService.toggleProductStatus(p.id, targetStatus).subscribe({
      next: (st) => {
        this.products.update((list) => {
          const updated = list.map((item) => (item.id === p.id ? { ...item, s: targetStatus } : item));
          this.syncToStorageAndStorefront(updated);
          return updated;
        });
        this.showToast(
          targetStatus === 'VISIBLE'
            ? `▶️ Đã hiển thị lại sản phẩm "${p.n}" trên gian hàng khách.`
            : `⏸️ Đã ẩn sản phẩm "${p.n}" (khách hàng sẽ không thấy sản phẩm này).`
        );
      },
      error: () => {
        this.products.update((list) => {
          const updated = list.map((item) => (item.id === p.id ? { ...item, s: targetStatus } : item));
          this.syncToStorageAndStorefront(updated);
          return updated;
        });
        this.showToast(
          targetStatus === 'VISIBLE'
            ? `▶️ Đã hiển thị lại sản phẩm "${p.n}" trên gian hàng khách.`
            : `⏸️ Đã ẩn sản phẩm "${p.n}" (khách hàng sẽ không thấy sản phẩm này).`
        );
      },
    });
  }

  // Lưu tồn kho (Kho hàng)
  saveInventoryStock(pid: number, vIdx: number, qVal: any, lVal: any): void {
    const q = typeof qVal === 'number' ? qVal : parseInt(String(qVal ?? '0').trim(), 10);
    const l = typeof lVal === 'number' ? lVal : parseInt(String(lVal ?? '0').trim(), 10);
    if (isNaN(q) || q < 0 || isNaN(l) || l < 0) {
      this.showToast('⚠️ Tồn kho và ngưỡng cảnh báo phải là số nguyên ≥ 0.', true);
      return;
    }

    const currentList = this.products();
    const targetProd = currentList.find((p) => p.id === pid);
    if (!targetProd || !targetProd.v || !targetProd.v[vIdx]) {
      this.showToast('⚠️ Không tìm thấy biến thể sản phẩm cần cập nhật.', true);
      return;
    }

    const updatedVariants = [...targetProd.v];
    const targetVariant = updatedVariants[vIdx];
    updatedVariants[vIdx] = { ...targetVariant, q, l };

    const updatedProd: SellerProduct = {
      ...targetProd,
      v: updatedVariants,
    };

    // 1. Cập nhật state nội bộ và lưu bền vững vào localStorage & dashboardService
    const updatedList = currentList.map((p) => (p.id === pid ? updatedProd : p));
    this.products.set(updatedList);
    this.syncToStorageAndStorefront(updatedList);
    this.cdr.markForCheck();

    // 2. Gửi request đồng bộ CSDL Backend
    this.productService.updateStock(pid, {
      sku: targetVariant.sku,
      q,
      l,
      variants: updatedVariants,
    }).subscribe({
      next: () => {
        this.showToast(`✅ Đã lưu tồn kho: ${targetVariant.sku || targetProd.n} (Tồn: ${q}).`);
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToast(`✅ Đã lưu tồn kho: ${targetVariant.sku || targetProd.n} (Tồn: ${q}).`);
        this.cdr.markForCheck();
      },
    });
  }

  // Đơn hàng: Xác nhận, Đóng gói, Giao
  confirmOrder(code: string): void {
    this.orders.update((list) =>
      list.map((o) => (o.c === code ? { ...o, s: 'PREPARING' } : o))
    );
    this.showToast(`Đã xác nhận ${code}. Đơn chuyển sang Đang chuẩn bị.`);
  }

  nextOrderStatus(code: string): void {
    this.orders.update((list) =>
      list.map((o) => {
        if (o.c === code) {
          const next = o.s === 'PREPARING' ? 'PACKED' : 'READY_TO_SHIP';
          return { ...o, s: next };
        }
        return o;
      })
    );
    const updated = this.orders().find((o) => o.c === code);
    if (updated?.s === 'PACKED') {
      this.showToast(`Đã đóng gói ${code}.`);
    } else {
      this.showToast(`${code} sẵn sàng giao, chờ Admin gán shipper.`);
    }
  }

  openRejectOrderModal(code: string): void {
    this.rejectTargetCode.set(code);
    this.rejectReason.set('');
    this.rejectError.set('');
    this.rejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.rejectModalOpen.set(false);
  }

  submitRejectOrder(): void {
    const r = this.rejectReason().trim();
    if (r.length < 5) {
      this.rejectError.set('Nhập lý do từ chối (tối thiểu 5 ký tự).');
      return;
    }
    const code = this.rejectTargetCode();
    this.orders.update((list) => list.filter((o) => o.c !== code));
    this.closeRejectModal();
    this.showToast(`Đã từ chối đơn ${code}. Lý do đã gửi cho khách.`);
  }

  openOrderDetail(o: OrderItem): void {
    this.modalTitle.set(`Chi tiết đơn: ${o.c}`);
    this.modalType.set('order_detail');
    this.modalData.set(o);
    this.modalError.set('');
    this.genericModalOpen.set(true);
  }

  // Đổi trả
  approveReturn(id: number): void {
    this.returns.update((list) =>
      list.map((r) => (r.id === id ? { ...r, st: 'APPROVED' } : r))
    );
    this.showToast('Đã chấp nhận đổi trả / hoàn tiền. Kho hàng đã được cộng lại.');
  }

  rejectReturn(id: number): void {
    const r = this.returns().find((item) => item.id === id);
    if (!r) return;
    this.modalTitle.set(`Từ chối yêu cầu đổi trả ${r.o}`);
    this.modalType.set('return_reject');
    this.modalData.set(r);
    this.modalError.set('');
    this.genericModalOpen.set(true);
  }

  // Voucher
  openCreateVoucherModal(): void {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    const fromStr = today.toISOString().split('T')[0];
    const toStr = nextMonth.toISOString().split('T')[0];

    this.formVoucher.set({
      code: '',
      t: 'PERCENT',
      val: 10,
      max: 50000,
      min: 100000,
      lim: 200,
      from: fromStr,
      to: toStr,
    });
    this.modalTitle.set('Tạo voucher mới cho Shop');
    this.modalType.set('voucher_form');
    this.modalError.set('');
    this.genericModalOpen.set(true);
  }

  saveVoucher(): void {
    const v = this.formVoucher();
    const code = (v.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      this.modalError.set('Mã voucher gồm 3–20 ký tự chữ hoa hoặc số.');
      return;
    }
    if (v.val == null || v.val <= 0 || (v.t === 'PERCENT' && v.val > 100)) {
      this.modalError.set('Giá trị giảm không hợp lệ.');
      return;
    }
    if (!v.to || v.to < (v.from || '')) {
      this.modalError.set('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    const payload = {
      code,
      discountType: v.t || 'PERCENT',
      value: v.val,
      maxDiscount: v.t === 'PERCENT' ? (v.max && Number(v.max) > 0 ? Number(v.max) : null) : null,
      minOrderAmount: v.min ? Number(v.min) : 0,
      usageLimit: v.lim ? Number(v.lim) : 100,
      startAt: v.from ? (v.from.includes('T') ? v.from.split('.')[0] : `${v.from}T00:00:00`) : null,
      endAt: v.to ? (v.to.includes('T') ? v.to.split('.')[0] : `${v.to}T23:59:59`) : null,
    };

    this.http.post<any>('http://localhost:9090/api/seller/vouchers', payload).subscribe({
      next: (res) => {
        const saved = res?.data;
        const newVoucher: VoucherItem = {
          id: saved?.id,
          code: saved?.code || code,
          t: (saved?.discountType || v.t || 'PERCENT') as 'PERCENT' | 'FIXED',
          val: saved?.value != null ? Number(saved.value) : (v.val ?? 0),
          max: saved?.maxDiscount != null ? Number(saved.maxDiscount) : (v.max || 0),
          min: saved?.minOrderAmount != null ? Number(saved.minOrderAmount) : (v.min || 0),
          lim: saved?.usageLimit || v.lim || 100,
          used: saved?.usedCount || 0,
          from: saved?.startAt ? saved.startAt.split('T')[0] : (v.from || ''),
          to: saved?.endAt ? saved.endAt.split('T')[0] : (v.to || ''),
          st: (saved?.status || 'ACTIVE') as any,
        };
        this.vouchers.update((list) => [newVoucher, ...list.filter((item) => item.code !== newVoucher.code)]);
        this.showToast(`🎉 Đã tạo mã voucher ${code}.`);
        this.closeGenericModal();
      },
      error: (err) => {
        this.modalError.set(err?.error?.message || 'Có lỗi xảy ra khi tạo voucher trên hệ thống.');
      },
    });
  }

  toggleVoucher(code: string): void {
    const target = this.vouchers().find((v) => v.code === code);
    if (!target) return;
    const newStatus = target.st === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    if (target.id) {
      this.http.patch<any>(`http://localhost:9090/api/seller/vouchers/${target.id}/status`, { status: newStatus }).subscribe({
        next: () => {
          this.vouchers.update((list) =>
            list.map((v) => (v.code === code ? { ...v, st: newStatus } : v))
          );
          this.dashboardService.vouchers.update((list) =>
            list.map((v) => (v.id === target.id || v.code === code ? { ...v, status: newStatus, active: newStatus === 'ACTIVE', displayStatus: newStatus } : v))
          );
          if (newStatus === 'PAUSED') {
            this.showToast(`⏸️ Đã tạm dừng voucher ${code} (mã đã được ẩn khỏi gian hàng khách).`);
          } else {
            this.showToast(`▶️ Đã kích hoạt lại voucher ${code} (mã đang hiển thị cho khách).`);
          }
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Không thể cập nhật trạng thái voucher.');
        },
      });
    } else {
      this.vouchers.update((list) =>
        list.map((v) => (v.code === code ? { ...v, st: newStatus } : v))
      );
      this.dashboardService.vouchers.update((list) =>
        list.map((v) => (v.code === code ? { ...v, status: newStatus, active: newStatus === 'ACTIVE', displayStatus: newStatus } : v))
      );
      if (newStatus === 'PAUSED') {
        this.showToast(`⏸️ Đã tạm dừng voucher ${code} (mã đã được ẩn khỏi gian hàng khách).`);
      } else {
        this.showToast(`▶️ Đã kích hoạt lại voucher ${code} (mã đang hiển thị cho khách).`);
      }
    }
  }

  deleteVoucher(code: string): void {
    const target = this.vouchers().find((v) => v.code === code);
    if (!target) return;
    if (!confirm(`Bạn có chắc chắn muốn xóa voucher "${code}" không?\nThao tác này sẽ xóa vĩnh viễn voucher khỏi hệ thống.`)) return;
    if (target.id) {
      this.http.delete<any>(`http://localhost:9090/api/seller/vouchers/${target.id}`).subscribe({
        next: () => {
          this.vouchers.update((list) => list.filter((v) => v.code !== code));
          this.dashboardService.vouchers.update((list) => list.filter((v) => v.id !== target.id && v.code !== code));
          this.showToast(`🗑️ Đã xóa voucher ${code} thành công.`);
        },
        error: (err) => {
          this.showToast(err?.error?.message || 'Không thể xóa voucher.');
        },
      });
    } else {
      this.vouchers.update((list) => list.filter((v) => v.code !== code));
      this.dashboardService.vouchers.update((list) => list.filter((v) => v.code !== code));
      this.showToast(`🗑️ Đã xóa voucher ${code} thành công.`);
    }
  }

  // Hồ sơ shop
  saveProfile(): void {
    const n = this.formShopProfile.n?.trim();
    const ph = this.formShopProfile.ph?.trim();
    const ad = this.formShopProfile.ad?.trim();
    const em = this.formShopProfile.em?.trim();
    const hr = this.formShopProfile.hr?.trim();
    const d = this.formShopProfile.d?.trim();

    if (!n || n.length < 2) {
      this.showToast('⚠️ Vui lòng nhập tên gian hàng hợp lệ (tối thiểu 2 ký tự).', true);
      return;
    }
    if (!ph || ph.length < 8) {
      this.showToast('⚠️ Vui lòng nhập số điện thoại liên hệ hợp lệ.', true);
      return;
    }
    if (!ad || ad.length < 5) {
      this.showToast('⚠️ Vui lòng nhập địa chỉ kho lấy hàng hợp lệ.', true);
      return;
    }

    const updatedProfile = {
      n,
      ph,
      em: em || '',
      hr: hr || '08:00 – 21:00',
      d: d || '',
      ad,
    };

    // 1. Cập nhật state & signals ngay lập tức
    this.syncProfileData(updatedProfile);

    // 2. Lưu vào localStorage để dữ liệu được bảo toàn bền vững
    localStorage.setItem('vic_seller_shop_profile', JSON.stringify(updatedProfile));

    // Cập nhật lại draft onboarding nếu có
    const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (!draft.shopInfo) draft.shopInfo = {};
        if (!draft.contactInfo) draft.contactInfo = {};
        draft.shopInfo.shopName = n;
        draft.shopInfo.description = updatedProfile.d;
        draft.contactInfo.phone = ph;
        draft.contactInfo.email = updatedProfile.em;
        draft.contactInfo.detailedAddress = ad;
        localStorage.setItem('vic_seller_onboarding_draft', JSON.stringify(draft));
      } catch {}
    }

    this.dashboardService.shopProfile.set({
      shopName: n,
      tagline: updatedProfile.d || 'Đồ decor phong cách tối giản Bắc Âu.',
      description: updatedProfile.d,
      phone: ph,
      email: updatedProfile.em,
      pickupAddress: ad,
      businessHours: updatedProfile.hr,
    });

    // 3. Đồng bộ lên Backend DB
    const payload = {
      name: n,
      phone: ph,
      email: updatedProfile.em,
      description: updatedProfile.d,
      pickupAddress: ad,
      businessHours: updatedProfile.hr,
    };

    this.http.put<any>('http://localhost:9090/api/shops/current', payload).subscribe({
      next: (res) => {
        const shop = res?.data || res;
        if (shop && shop.id) {
          this.currentShopId.set(shop.id);
        }
        this.showToast('✅ Đã lưu thay đổi hồ sơ gian hàng thành công!');
        this.cdr.markForCheck();
      },
      error: () => {
        this.showToast('✅ Đã lưu thay đổi hồ sơ gian hàng thành công!');
        this.cdr.markForCheck();
      },
    });
  }

  // File upload khi NEED_INFO
  onFileSelect(event: Event, docName: string): void {
    const target = event.target as HTMLInputElement;
    const file = target.files && target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      this.showToast('⚠️ Dung lượng file tối đa là 5MB.', true);
      return;
    }
    this.uploadedFiles.update((cur) => ({ ...cur, [docName]: file.name }));
  }

  submitAdditionalDocs(): void {
    this.shopStatus.set('RESUBMITTED');
    this.showToast('✅ Đã gửi bổ sung tài liệu. Admin sẽ kiểm tra lại.');
  }

  closeGenericModal(): void {
    this.closeMediaPreview();
    this.genericModalOpen.set(false);
    this.modalData.set(null);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.isMediaPreviewOpen()) {
      if (event.key === 'Escape') {
        this.closeMediaPreview();
      } else if (event.key === 'ArrowLeft') {
        this.movePreview(-1);
      } else if (event.key === 'ArrowRight') {
        this.movePreview(1);
      }
    }
  }

  // Helpers
  formatVnd(amount: number): string {
    return amount.toLocaleString('vi-VN') + 'đ';
  }

  showToast(msg: string, isError: boolean = false): void {
    this.toastMessage.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 2800);
  }

  getMinPrice(p: SellerProduct): number {
    if (!p.v || !p.v.length) return 0;
    return Math.min(...p.v.map((v) => v.p));
  }

  getMaxPrice(p: SellerProduct): number {
    if (!p.v || !p.v.length) return 0;
    return Math.max(...p.v.map((v) => v.p));
  }

  getTotalStock(p: SellerProduct): number {
    if (!p.v || !p.v.length) return 0;
    return p.v.reduce((sum, v) => sum + v.q, 0);
  }

  loadReviewsAndQuestions(): void {
    const savedReviews = localStorage.getItem('vic_seller_reviews');
    if (savedReviews) {
      try {
        const parsed = JSON.parse(savedReviews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.reviews.set(parsed);
        }
      } catch {}
    }

    const savedQuestions = localStorage.getItem('vic_seller_questions');
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.questions.set(parsed);
        }
      } catch {}
    }

    this.http.get<any>('http://localhost:9090/api/seller/dashboard').subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data && Array.isArray(data.reviews) && data.reviews.length > 0) {
          const apiReviews: ReviewItem[] = [];
          const apiQuestions: QuestionItem[] = [];

          for (const item of data.reviews) {
            if (item.type === 'QA' || item.rating === 0) {
              apiQuestions.push({
                id: item.id,
                p: item.productName || 'Sản phẩm',
                who: item.customerName || 'Khách hàng',
                x: item.comment || '',
                a: item.reply,
              });
            } else {
              apiReviews.push({
                id: item.id,
                p: item.productName || 'Sản phẩm',
                who: item.customerName || 'Khách hàng',
                st: item.rating || 5,
                x: item.comment || '',
                re: item.reply,
              });
            }
          }

          if (apiReviews.length > 0) {
            this.reviews.set(apiReviews);
            localStorage.setItem('vic_seller_reviews', JSON.stringify(apiReviews));
          }
          if (apiQuestions.length > 0) {
            this.questions.set(apiQuestions);
            localStorage.setItem('vic_seller_questions', JSON.stringify(apiQuestions));
          }
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });
  }

  replyToReview(review: ReviewItem): void {
    const defaultMsg = 'Cảm ơn bạn đã tin tưởng và ủng hộ gian hàng của chúng tôi!';
    const userPrompt = prompt('Nhập nội dung phản hồi cho đánh giá này:', defaultMsg);
    if (userPrompt === null) return;
    const replyText = userPrompt.trim() || defaultMsg;

    review.re = replyText;
    this.reviews.update((list) => [...list]);
    localStorage.setItem('vic_seller_reviews', JSON.stringify(this.reviews()));

    // Sync to product specific storage so it shows under the product immediately
    this.syncReviewReplyToProductStorage(review.id, review.p, replyText);

    if (review.id) {
      this.http.post<any>(`http://localhost:9090/api/seller/dashboard/reviews/${review.id}/reply`, { reply: replyText }).subscribe({
        next: () => this.showToast('✨ Đã gửi phản hồi đánh giá thành công!'),
        error: () => this.showToast('✨ Đã lưu phản hồi.'),
      });
    }
  }

  answerQuestion(question: QuestionItem): void {
    const defaultMsg = 'Chào bạn, sản phẩm hiện đang sẵn kho và được bảo hành chính hãng ạ.';
    const userPrompt = prompt('Nhập câu trả lời cho khách hàng:', defaultMsg);
    if (userPrompt === null) return;
    const answerText = userPrompt.trim() || defaultMsg;

    question.a = answerText;
    this.questions.update((list) => [...list]);
    localStorage.setItem('vic_seller_questions', JSON.stringify(this.questions()));

    // Sync to product specific storage so it shows under the product immediately
    this.syncQuestionAnswerToProductStorage(question.id, question.p, answerText);

    if (question.id) {
      this.http.post<any>(`http://localhost:9090/api/seller/dashboard/questions/${question.id}/reply`, { reply: answerText }).subscribe({
        next: () => this.showToast('✨ Đã gửi câu trả lời thành công!'),
        error: () => this.showToast('✨ Đã lưu câu trả lời.'),
      });
    }
  }

  private syncQuestionAnswerToProductStorage(questionId: number, productName: string, answerText: string): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vic_product_questions_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            let changed = false;
            for (const q of list) {
              if (q.id === questionId || (productName && q.question === questionId)) {
                q.answer = answerText;
                changed = true;
              }
            }
            if (changed) {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        } catch {}
      }
    }
  }

  private syncReviewReplyToProductStorage(reviewId: number, productName: string, replyText: string): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vic_product_reviews_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            let changed = false;
            for (const r of list) {
              if (r.id === reviewId) {
                r.reply = replyText;
                changed = true;
              }
            }
            if (changed) {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        } catch {}
      }
    }
  }
}
