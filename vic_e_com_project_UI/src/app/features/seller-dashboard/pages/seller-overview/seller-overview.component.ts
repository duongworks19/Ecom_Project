import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerOrdersApiService } from '../../services/seller-orders-api.service';
import { SellerProductService } from '../../services/seller-product.service';
import { SellerShopApiService } from '../../services/seller-shop-api.service';
import { SellerVouchersApiService } from '../../services/seller-vouchers-api.service';
import { SellerQaReviewsApiService } from '../../services/seller-qa-reviews-api.service';
import { SellerReturnsApiService } from '../../services/seller-returns-api.service';
import { OrderItem } from '../../models/seller-dashboard.model';
import { SellerRejectOrderDialogComponent } from '../../components/seller-reject-order-dialog/seller-reject-order-dialog.component';

@Component({
  selector: 'app-seller-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, SellerRejectOrderDialogComponent],
  templateUrl: './seller-overview.component.html',
  styleUrl: './seller-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOverviewComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly ordersApi = inject(SellerOrdersApiService);
  private readonly productService = inject(SellerProductService);
  private readonly shopApi = inject(SellerShopApiService);
  private readonly vouchersApi = inject(SellerVouchersApiService);
  private readonly qaReviewsApi = inject(SellerQaReviewsApiService);
  private readonly returnsApi = inject(SellerReturnsApiService);

  readonly products = this.store.products;
  readonly orders = this.store.orders;
  readonly questions = this.store.questions;
  readonly reviews = this.store.reviews;
  readonly returns = this.store.returns;
  readonly vouchers = this.store.vouchers;

  readonly totalTodoCount = this.store.totalTodoCount;
  readonly openOrdersCount = this.store.openOrdersCount;
  readonly pendingOrderCount = this.store.pendingOrderCount;
  readonly preparingOrderCount = this.store.preparingOrderCount;
  readonly pendingReturnCount = this.store.pendingReturnCount;
  readonly lowStockItems = this.store.lowStockItems;
  readonly unrepliedQuestionCount = this.store.unrepliedQuestionCount;
  readonly unrepliedReviewCount = this.store.unrepliedReviewCount;
  readonly unrepliedReviews = computed(() => this.reviews().filter((r) => !r.re));

  // Real KPI stats from Database (/api/seller/dashboard)
  readonly todayRevenue = signal<number>(0);
  readonly revenueGrowthPercent = signal<number>(0);
  readonly totalOrdersToday = signal<number>(0);
  readonly cancellationRate = signal<number>(0);
  readonly averageRating = signal<number>(0);
  readonly totalReviews = signal<number>(0);

  // Real 7-day revenue chart from Database
  readonly revChart = signal<number[]>([0, 0, 0, 0, 0, 0, 0]);
  readonly revDays = signal<string[]>(['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']);
  readonly maxChartValue = computed(() => {
    const max = Math.max(...this.revChart(), 1);
    return max > 0 ? max : 1;
  });

  // Real Onboarding Checklist progress from Database
  readonly hasShopProfile = computed(() => !!this.store.shopProfile()?.n?.trim());
  readonly hasPickupAddress = computed(() => !!this.store.shopProfile()?.ad?.trim());
  readonly hasFiveProducts = computed(() => this.store.allProductCount() >= 5);
  readonly hasFirstVoucher = computed(() => this.vouchers().length > 0);
  readonly completedOnboardingSteps = computed(
    () =>
      (this.hasShopProfile() ? 1 : 0) +
      (this.hasPickupAddress() ? 1 : 0) +
      (this.hasFiveProducts() ? 1 : 0) +
      (this.hasFirstVoucher() ? 1 : 0)
  );
  readonly onboardingProgressWidth = computed(() => (this.completedOnboardingSteps() / 4) * 100);

  readonly filterOrder = signal<string>('ALL');
  readonly rejectModalOpen = signal<boolean>(false);
  readonly rejectTargetCode = signal<string>('');

  readonly userAccountName = computed(() => {
    try {
      const draftRaw = localStorage.getItem('seller_onboarding_draft') || localStorage.getItem('vic_seller_onboarding_draft');
      if (draftRaw) {
        const d = JSON.parse(draftRaw);
        if (d.userInfo?.fullName) return d.userInfo.fullName;
        if (d.contactInfo?.representativeName?.trim()) return d.contactInfo.representativeName.trim();
      }
      const fullName = localStorage.getItem('fullName');
      if (fullName && fullName !== 'Thành viên' && fullName !== 'null') return fullName.trim();
    } catch { }
    return 'Người bán VICMART';
  });

  readonly shopName = computed(() => {
    const p = this.store.shopProfile();
    if (p?.n?.trim()) return p.n.trim();
    try {
      const saved = localStorage.getItem('seller_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.n?.trim()) return parsed.n.trim();
        if (parsed?.shopName?.trim()) return parsed.shopName.trim();
      }
    } catch { }
    return 'Gian hàng của tôi';
  });

  readonly filteredOrders = computed(() => {
    const st = this.filterOrder();
    return this.orders().filter((o) => {
      if (st === 'ALL') {
        return o.s === 'PENDING' || o.s === 'PREPARING' || o.s === 'PACKED' || o.s === 'READY_TO_SHIP';
      }
      return o.s === st;
    });
  });

  ngOnInit(): void {
    this.refreshOverviewData();
  }

  private refreshOverviewData(): void {
    this.http.get<any>(`${environment.apiUrl}/seller/dashboard`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data?.stats) {
          this.todayRevenue.set(Number(data.stats.todayRevenue) || 0);
          this.revenueGrowthPercent.set(Number(data.stats.revenueGrowthPercent) || 0);
          this.totalOrdersToday.set(Number(data.stats.totalOrdersToday) || 0);
          this.cancellationRate.set(Number(data.stats.cancellationRate) || 0);
          this.averageRating.set(Number(data.stats.averageRating) || 0);
          this.totalReviews.set(Number(data.stats.totalReviews) || 0);
        }
        if (Array.isArray(data?.revenueChart7Days) && data.revenueChart7Days.length > 0) {
          this.revChart.set(data.revenueChart7Days.map((p: any) => Number(p.valueInMillions) || 0));
          this.revDays.set(data.revenueChart7Days.map((p: any) => p.label || ''));
        }
        if (data?.shopProfile) {
          this.store.setShopProfile(data.shopProfile);
        }
        if (Array.isArray(data?.vouchers)) {
          this.store.setVouchers(data.vouchers);
        }
      },
      error: () => {},
    });

    this.shopApi.getSellerProfile().subscribe({
      next: (prof) => {
        if (prof) this.store.setShopProfile(prof);
      },
      error: () => {},
    });

    this.ordersApi.getOrders().subscribe({
      next: (orders: any) => {
        const list = orders?.data || orders || [];
        if (Array.isArray(list)) this.store.setOrders(list);
      },
      error: () => {},
    });

    this.productService.getProducts().subscribe({
      next: (prods) => {
        if (Array.isArray(prods)) this.store.products.set(prods);
      },
      error: () => {},
    });

    this.vouchersApi.getVouchers().subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) this.store.setVouchers(list);
      },
      error: () => {},
    });

    this.qaReviewsApi.getReviews().subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) this.store.setReviews(list);
      },
      error: () => {},
    });

    this.qaReviewsApi.getQuestions().subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) this.store.setQuestions(list);
      },
      error: () => {},
    });

    this.returnsApi.getReturns().subscribe({
      next: (res: any) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) this.store.setReturns(list);
      },
      error: () => {},
    });
  }

  formatVnd(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + 'đ';
  }

  navigateToOrders(filter: string): void {
    this.router.navigate(['/seller/dashboard/orders']);
  }

  confirmOrder(code: string): void {
    this.orders.update((list) =>
      list.map((o) => (o.c === code ? { ...o, s: 'PREPARING' as const } : o))
    );
    this.ordersApi.confirmOrder(code).subscribe({ next: () => {}, error: () => {} });
    this.store.showToast(`Đã xác nhận ${code}. Đơn chuyển sang Đang chuẩn bị.`);
  }

  nextOrderStatus(code: string): void {
    const target = this.orders().find((o) => o.c === code);
    if (!target) return;
    let nextSt: OrderItem['s'] = target.s;
    let action = '';

    if (target.s === 'PREPARING') {
      nextSt = 'PACKED';
      action = 'MARK_PACKED';
    } else if (target.s === 'PACKED') {
      nextSt = 'READY_TO_SHIP';
      action = 'START_SHIPPING';
    }

    if (nextSt !== target.s) {
      this.orders.update((list) =>
        list.map((o) => (o.c === code ? { ...o, s: nextSt } : o))
      );
      this.ordersApi.updateOrderStatus(code, action).subscribe({
        error: () => {
          this.orders.update((list) => list.map((o) => (o.c === code ? { ...o, s: target.s } : o)));
          this.store.showToast(`Không thể lưu trạng thái đơn ${code}.`, true);
        },
      });
      if (nextSt === 'PACKED') {
        this.store.showToast(`Đã đóng gói ${code}.`);
      } else if (nextSt === 'READY_TO_SHIP') {
        this.store.showToast(`${code} sẵn sàng giao, chờ Admin gán shipper.`);
      }
    }
  }

  openRejectOrderModal(code: string): void {
    this.rejectTargetCode.set(code);
    this.rejectModalOpen.set(true);
  }

  closeRejectModal(): void {
    this.rejectModalOpen.set(false);
  }

  handleRejectOrder(event: { code: string; reason: string }): void {
    this.orders.update((list) => list.filter((o) => o.c !== event.code));
    this.ordersApi.cancelOrder(event.code, event.reason).subscribe({ next: () => {}, error: () => {} });
    this.closeRejectModal();
    this.store.showToast(`Đã từ chối đơn ${event.code}.`);
  }
}
