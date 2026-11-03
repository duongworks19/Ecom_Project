import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OrderItem } from '../../models/seller-dashboard.model';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerOrdersApiService } from '../../services/seller-orders-api.service';
import { SellerRejectOrderDialogComponent } from '../../components/seller-reject-order-dialog/seller-reject-order-dialog.component';
import { SellerOrderDetailDialogComponent } from '../../components/seller-order-detail-dialog/seller-order-detail-dialog.component';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SellerRejectOrderDialogComponent,
    SellerOrderDetailDialogComponent,
  ],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOrdersComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly ordersApi = inject(SellerOrdersApiService);

  readonly orders = this.store.orders;
  readonly pendingOrderCount = this.store.pendingOrderCount;
  readonly preparingOrderCount = this.store.preparingOrderCount;

  readonly filterOrder = signal<string>('ALL');
  readonly orderDaysFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isLoading = signal<boolean>(false);
  readonly loadError = signal<string | null>(null);

  readonly rejectModalOpen = signal<boolean>(false);
  readonly rejectTargetCode = signal<string>('');

  readonly orderDetailOpen = signal<boolean>(false);
  readonly selectedOrderDetail = signal<OrderItem | null>(null);

  readonly filteredOrders = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.filterOrder();
    const days = this.orderDaysFilter();

    return this.orders().filter((o) => {
      const matchStatus = st === 'ALL' || o.s === st;
      const matchSearch = !q || o.c.toLowerCase().includes(q) || o.n.toLowerCase().includes(q);
      const matchDays =
        days === 'ALL' ||
        (days === '0' && (o.d === 0 || o.h.includes(':') || o.h.includes('Vừa xong'))) ||
        (days === '7' && (o.d === undefined || o.d <= 7));
      return matchStatus && matchSearch && matchDays;
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  formatVnd(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + 'đ';
  }

  loadOrders(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.ordersApi.getOrders().subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          const mapped: OrderItem[] = list.map((item: any) => ({
            c: item.code || item.c || `VM${item.id}`,
            n: item.customerName || item.n || 'Khách hàng',
            k: item.itemCount || item.k || 1,
            t: item.totalAmount || item.t || 0,
            s: item.status || item.s || 'PENDING',
            h: item.time || item.h || 'Vừa xong',
            d: item.itemCount || item.d || 1,
          }));
          this.orders.set(mapped);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.loadError.set(err?.error?.message || 'Không thể tải danh sách đơn hàng. Vui lòng thử lại.');
      },
    });
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
    this.store.showToast(`Đã từ chối đơn ${event.code}. Lý do đã gửi cho khách.`);
  }

  openOrderDetail(o: OrderItem): void {
    this.selectedOrderDetail.set(o);
    this.orderDetailOpen.set(true);
  }

  closeOrderDetail(): void {
    this.orderDetailOpen.set(false);
  }
}
