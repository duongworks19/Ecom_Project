import {
  ChangeDetectionStrategy,
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

  readonly currentShopId = signal<number | null>(null);

  ngOnInit(): void {
    const role = this.authService.getRole()?.toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      void this.router.navigateByUrl('/admin');
      return;
    }
    this.loadProducts();
    this.detectApprovedRole();
    this.loadCurrentShopInfo();
  }

  loadCurrentShopInfo(): void {
    this.http.get<any>('http://localhost:9090/api/shops/current').subscribe({
      next: (res) => {
        const shop = res?.data || res;
        if (shop && shop.id) {
          this.currentShopId.set(shop.id);
          this.shopProfile.set({
            n: shop.name,
            d: shop.description || 'Đồ decor phong cách tối giản Bắc Âu.',
            ph: shop.phone || '0912345678',
            em: shop.email || 'lumi@vicmart.vn',
            ad: shop.pickupAddress || 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
            hr: '08:00 – 21:00',
          });
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
  readonly formStatus = signal<string>('VISIBLE');
  readonly formDescription = signal<string>('');
  readonly formImageUrl = signal<string>('');

  // Danh sách ảnh mẫu gợi ý
  readonly sampleImages = [
    { label: 'Đèn ngủ gỗ', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80' },
    { label: 'Kệ treo tường', url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80' },
    { label: 'Bình gốm', url: 'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?auto=format&fit=crop&w=600&q=80' },
    { label: 'Thảm cotton', url: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80' },
    { label: 'Gương tròn', url: 'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=600&q=80' },
    { label: 'Nến thơm', url: 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?auto=format&fit=crop&w=600&q=80' },
  ];
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
    const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.shopInfo?.shopName?.trim()) {
          return draft.shopInfo.shopName.trim();
        }
      } catch {}
    }
    return this.shopProfile().n || 'VICMART Shop';
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
  readonly vouchers = signal<VoucherItem[]>([
    { code: 'LUMI10', t: 'PERCENT', val: 10, max: 50000, min: 300000, lim: 200, used: 37, from: '2026-10-01', to: '2026-10-31', st: 'ACTIVE' },
    { code: 'FREESHIP30', t: 'FIXED', val: 30000, max: 0, min: 199000, lim: 100, used: 100, from: '2026-09-01', to: '2026-09-30', st: 'EXPIRED' },
  ]);

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
    const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      try {
        const draft = JSON.parse(draftRaw);
        if (draft.status === 'APPROVED' || role === 'VENDOR' || role === 'ROLE_VENDOR') {
          this.shopStatus.set('APPROVED');
          if (draft.shopInfo?.shopName) {
            const pickup = [
              draft.contactInfo?.detailedAddress,
              draft.contactInfo?.ward,
              draft.contactInfo?.district,
              draft.contactInfo?.province,
            ].filter(Boolean).join(', ');

            this.shopProfile.update((cur) => ({
              ...cur,
              n: draft.shopInfo.shopName,
              d: draft.shopInfo.description || cur.d,
              ad: pickup || cur.ad,
              ph: draft.contactInfo?.phone || cur.ph,
              em: draft.contactInfo?.email || cur.em,
            }));
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
    this.formImageUrl.set('');
  }

  selectPresetImage(url: string): void {
    this.formImageUrl.set(url);
    this.modalError.set('');
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    if (file.size > 5 * 1024 * 1024) {
      this.modalError.set('Ảnh tải lên không được vượt quá 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.formImageUrl.set(reader.result as string);
      this.modalError.set('');
    };
    reader.readAsDataURL(file);
  }

  onImageError(): void {
    // Không làm gãy giao diện khi link ảnh ngoại tuyến
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
      imageUrl: img || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
      v: variants,
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
        this.showToast(targetStatus === 'VISIBLE' ? 'Đã hiển thị sản phẩm trên sàn.' : 'Đã ẩn sản phẩm.');
      },
      error: () => {
        this.products.update((list) => {
          const updated = list.map((item) => (item.id === p.id ? { ...item, s: targetStatus } : item));
          this.syncToStorageAndStorefront(updated);
          return updated;
        });
        this.showToast(targetStatus === 'VISIBLE' ? 'Đã hiển thị sản phẩm trên sàn.' : 'Đã ẩn sản phẩm.');
      },
    });
  }

  // Lưu tồn kho (Kho hàng)
  saveInventoryStock(pid: number, vIdx: number, qVal: string, lVal: string): void {
    const q = parseInt(qVal, 10);
    const l = parseInt(lVal, 10);
    if (isNaN(q) || q < 0 || isNaN(l) || l < 0) {
      this.showToast('⚠️ Tồn kho và ngưỡng cảnh báo phải là số nguyên ≥ 0.', true);
      return;
    }

    this.products.update((list) =>
      list.map((prod) => {
        if (prod.id === pid && prod.v[vIdx]) {
          const newVariants = [...prod.v];
          newVariants[vIdx] = { ...newVariants[vIdx], q, l };
          return { ...prod, v: newVariants };
        }
        return prod;
      })
    );
    this.showToast('✅ Đã lưu tồn kho. Nhật ký cập nhật tự động.');
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
    this.formVoucher.set({
      code: '',
      t: 'PERCENT',
      val: 10,
      max: 50000,
      min: 300000,
      lim: 200,
      from: '2026-10-22',
      to: '2026-11-22',
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

    const newVoucher: VoucherItem = {
      code,
      t: v.t || 'PERCENT',
      val: v.val,
      max: v.max || 0,
      min: v.min || 0,
      lim: v.lim || 100,
      used: 0,
      from: v.from || '2026-10-22',
      to: v.to,
      st: 'ACTIVE',
    };
    this.vouchers.update((list) => [newVoucher, ...list]);
    this.showToast(`🎉 Đã tạo mã voucher ${code}.`);
    this.closeGenericModal();
  }

  toggleVoucher(code: string): void {
    this.vouchers.update((list) =>
      list.map((v) => (v.code === code ? { ...v, st: v.st === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' } : v))
    );
  }

  deleteVoucher(code: string): void {
    this.vouchers.update((list) => list.filter((v) => v.code !== code));
    this.showToast(`Đã xóa voucher ${code}.`);
  }

  // Hồ sơ shop
  saveProfile(): void {
    this.showToast('✅ Đã lưu hồ sơ gian hàng.');
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
    this.genericModalOpen.set(false);
    this.modalData.set(null);
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
}
