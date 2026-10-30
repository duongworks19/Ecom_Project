import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { formatDateVn } from '../../../../shared/pipes/date-format.util';
import { AdminOrdersService } from './services/admin-orders.service';
import { AdminOrderDetailComponent } from './components/admin-order-detail/admin-order-detail.component';
import {
  AdminOrderDetail,
  AdminOrderItem,
  AdminOrderSummary,
  ShopOption,
  ADMIN_ORDER_STATUS_CHIPS,
} from './models/admin-orders.model';

@Component({
  selector: 'vic-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe, AdminOrderDetailComponent],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private readonly ordersService = inject(AdminOrdersService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly search$ = new Subject<string>();

  readonly statusChips = ADMIN_ORDER_STATUS_CHIPS;
  readonly summary = signal<AdminOrderSummary | null>(null);
  readonly items = signal<AdminOrderItem[]>([]);
  readonly selectedItem = signal<AdminOrderItem | null>(null);
  readonly selectedDetail = signal<AdminOrderDetail | null>(null);
  readonly loadingOrders = signal<boolean>(false);
  readonly loadingDetail = signal<boolean>(false);
  readonly loadingSummary = signal<boolean>(false);
  readonly ordersError = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly isDrawerOpen = signal<boolean>(false);
  readonly shops = signal<ShopOption[]>([]);

  readonly searchQuery = signal<string>('');
  readonly selectedStatus = signal<string>('ALL');
  readonly selectedShopId = signal<number | undefined>(undefined);
  readonly selectedPaymentMethod = signal<string>('ALL');
  readonly dateFrom = signal<string>('');
  readonly dateTo = signal<string>('');
  readonly currentPage = signal<number>(1);
  readonly pageSize = signal<number>(20);
  readonly totalOrders = signal<number>(0);
  readonly totalPages = signal<number>(1);

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => {
        this.searchQuery.set(query);
        this.resetAndReload();
      });

    this.loadSummary();
    this.loadShops();
    this.loadOrders();
  }

  loadSummary(): void {
    this.loadingSummary.set(true);
    this.ordersService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loadingSummary.set(false);
      },
      error: () => this.loadingSummary.set(false),
    });
  }

  loadShops(): void {
    this.ordersService.getShops().subscribe({
      next: (data) => this.shops.set(data),
      error: () => {}, // ponytail: non-blocking if shop list fails to load
    });
  }

  loadOrders(): void {
    this.loadingOrders.set(true);
    this.ordersError.set(null);

    this.ordersService
      .getOrders({
        q: this.searchQuery(),
        status: this.selectedStatus(),
        shopId: this.selectedShopId(),
        paymentMethod: this.selectedPaymentMethod(),
        from: this.dateFrom(),
        to: this.dateTo(),
        page: this.currentPage(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (page) => {
          this.items.set(page.items);
          this.totalOrders.set(page.total);
          this.totalPages.set(page.totalPages);
          this.loadingOrders.set(false);
          const selectedId = this.selectedItem()?.id;
          const first = page.items[0];
          if (!first) {
            this.closeDetail();
          } else if (!selectedId || !page.items.some((item) => item.id === selectedId)) {
            this.selectOrder(first);
          }
        },
        error: (err) => {
          this.ordersError.set(err.message);
          this.loadingOrders.set(false);
        },
      });
  }

  onSearchInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    this.search$.next(val);
  }

  onSelectChip(key: string): void {
    if (this.selectedStatus() === key) return;
    this.selectedStatus.set(key);
    this.resetAndReload();
  }

  onShopChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedShopId.set(val ? Number(val) : undefined);
    this.resetAndReload();
  }

  onPaymentChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedPaymentMethod.set(val || 'ALL');
    this.resetAndReload();
  }

  onDateFromChange(event: Event): void {
    this.dateFrom.set((event.target as HTMLInputElement).value);
    this.resetAndReload();
  }

  onDateToChange(event: Event): void {
    this.dateTo.set((event.target as HTMLInputElement).value);
    this.resetAndReload();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadOrders();
  }

  selectOrder(item: AdminOrderItem): void {
    this.selectedItem.set(item);
    this.isDrawerOpen.set(true);
    this.loadingDetail.set(true);
    this.detailError.set(null);

    this.ordersService.getOrderDetail(item.id).subscribe({
      next: (detail) => {
        this.selectedDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: (err) => {
        this.detailError.set(err.message);
        this.loadingDetail.set(false);
      },
    });
  }

  closeDetail(): void {
    this.isDrawerOpen.set(false);
    this.selectedItem.set(null);
    this.selectedDetail.set(null);
  }

  formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) return 'Chưa có thời gian';
    return formatDateVn(isoDate, true);
  }

  private resetAndReload(): void {
    this.currentPage.set(1);
    this.loadOrders();
  }
}
