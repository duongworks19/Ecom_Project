import { Injectable, computed, signal } from '@angular/core';
import {
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

@Injectable({
  providedIn: 'root',
})
export class SellerDashboardStore {
  // Shop & Vendor Profile
  readonly currentShopId = signal<number | null>(null);
  readonly shopStatus = signal<string>('APPROVED');
  readonly shopProfile = signal<ShopProfileData>({
    n: 'Lumi Home Decor',
    d: 'Đồ decor phong cách tối giản Bắc Âu.',
    ph: '0912345678',
    em: 'lumi@vicmart.vn',
    ad: 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
    hr: '08:00 – 21:00',
  });

  // Core Data Lists
  readonly products = signal<SellerProduct[]>([]);
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
  readonly returns = signal<ReturnItem[]>([
    { id: 1, o: 'VM2610-0377', n: 'Nguyễn Văn An', type: 'Trả hàng hoàn tiền', why: 'Hàng bị nứt khi nhận', amt: 329000, img: 2, st: 'PENDING' },
    { id: 2, o: 'VM2610-0369', n: 'Lê Thị Hoa', type: 'Đổi hàng', why: 'Giao sai màu', amt: 179000, img: 1, st: 'PENDING' },
  ]);
  readonly reviews = signal<ReviewItem[]>([
    { id: 1, p: 'Đèn ngủ gỗ sồi', who: 'Trần Thu Hà', st: 5, x: 'Đèn đẹp, ánh sáng ấm, đóng gói kỹ.' },
    { id: 2, p: 'Kệ treo tường', who: 'Phạm Ngọc Anh', st: 2, x: 'Giao hơi chậm và hộp bị móp.' },
    { id: 3, p: 'Bình gốm trắng', who: 'Vũ Hải Yến', st: 4, x: 'Men đẹp, đúng mô tả.', re: 'Cảm ơn bạn đã ủng hộ Lumi!' },
  ]);
  readonly questions = signal<QuestionItem[]>([
    { id: 1, p: 'Đèn ngủ gỗ sồi', who: 'Ngô Anh', x: 'Đèn ngủ có kèm bóng không ạ?' },
    { id: 2, p: 'Kệ treo tường', who: 'Đỗ Minh', x: 'Kệ treo chịu tải tối đa bao nhiêu kg?' },
    { id: 3, p: 'Bình gốm trắng', who: 'Lan Chi', x: 'Bình gốm có màu kem không shop?' },
  ]);
  readonly vouchers = signal<VoucherItem[]>([]);

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
    () => this.pendingOrderCount() + this.preparingOrderCount() + this.lowStockItems().length + this.unrepliedQuestionCount()
  );

  readonly allProductCount = computed(() => this.products().filter((p) => p.s !== 'DELETED').length);
  readonly visibleProductCount = computed(() => this.products().filter((p) => p.s === 'VISIBLE').length);
  readonly hiddenProductCount = computed(() => this.products().filter((p) => p.s === 'HIDDEN').length);
  readonly draftProductCount = computed(() => this.products().filter((p) => p.s === 'DRAFT').length);

  // Toast actions
  showToast(msg: string, isError: boolean = false): void {
    this.isToastError.set(isError);
    this.toastMessage.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 2800);
  }
}
