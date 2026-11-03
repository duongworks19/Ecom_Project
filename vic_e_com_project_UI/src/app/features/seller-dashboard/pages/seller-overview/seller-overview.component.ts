import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerOrdersApiService } from '../../services/seller-orders-api.service';
import { SellerProductService } from '../../services/seller-product.service';
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
  private readonly router = inject(Router);
  private readonly ordersApi = inject(SellerOrdersApiService);
  private readonly productService = inject(SellerProductService);

  readonly products = this.store.products;
  readonly orders = this.store.orders;
  readonly questions = this.store.questions;
  readonly returns = this.store.returns;

  readonly totalTodoCount = this.store.totalTodoCount;
  readonly openOrdersCount = this.store.openOrdersCount;
  readonly pendingOrderCount = this.store.pendingOrderCount;
  readonly preparingOrderCount = this.store.preparingOrderCount;
  readonly pendingReturnCount = this.store.pendingReturnCount;
  readonly lowStockItems = this.store.lowStockItems;
  readonly unrepliedQuestionCount = this.store.unrepliedQuestionCount;

  readonly revChart = [1.2, 2.1, 1.8, 3.4, 4.6, 2.8, 3.2];
  readonly revDays = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

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
    return 'Lumi Home Decor';
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
    this.ordersApi.getOrders().subscribe({
      next: (orders: any) => {
        const list = orders?.data || orders;
        if (Array.isArray(list)) this.store.orders.set(list);
      },
      error: () => {},
    });
    this.productService.getProducts().subscribe({
      next: (prods) => { if (prods) this.store.products.set(prods); },
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
      action = 'PACK';
    } else if (target.s === 'PACKED') {
      nextSt = 'READY_TO_SHIP';
      action = 'SHIP';
    }

    if (nextSt !== target.s) {
      this.orders.update((list) =>
        list.map((o) => (o.c === code ? { ...o, s: nextSt } : o))
      );
      this.ordersApi.updateOrderStatus(code, action).subscribe({ next: () => {}, error: () => {} });
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
