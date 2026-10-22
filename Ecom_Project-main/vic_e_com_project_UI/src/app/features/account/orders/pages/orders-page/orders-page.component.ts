import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { OrdersApiService } from '../../data-access/orders-api.service';
import {
  CustomerOrder,
  OrderStatusCounts,
  OrderStatusFilter,
} from '../../data-access/orders.models';
import { isValidOrderStatusFilter } from '../../utils/order-status.map';
import { ApiError } from '../../../../../core/api/api-error.model';
import { SkeletonComponent } from '../../../../../shared/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../../shared/ui/empty-state/empty-state.component';
import { ErrorStateComponent } from '../../../../../shared/ui/error-state/error-state.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { OrderStatusTabsComponent } from '../../components/order-status-tabs/order-status-tabs.component';
import { OrderCardComponent } from '../../components/order-card/order-card.component';
import { CancelOrderDialogComponent } from '../../components/cancel-order-dialog/cancel-order-dialog.component';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SkeletonComponent,
    EmptyStateComponent,
    ErrorStateComponent,
    ButtonComponent,
    OrderStatusTabsComponent,
    OrderCardComponent,
    CancelOrderDialogComponent,
  ],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPageComponent implements OnInit {
  private readonly ordersApi = inject(OrdersApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastService = inject(ToastService);

  readonly activeStatus = signal<OrderStatusFilter>('ALL');
  readonly searchKeyword = signal<string>('');
  readonly page = signal<number>(0);
  readonly totalPages = signal<number>(0);
  readonly totalElements = signal<number>(0);
  readonly countsByStatus = signal<OrderStatusCounts | undefined>(undefined);

  readonly orders = signal<CustomerOrder[]>([]);
  readonly loading = signal<boolean>(false);
  readonly error = signal<ApiError | null>(null);

  readonly cancelingOrder = signal<CustomerOrder | null>(null);
  readonly cancelingLoading = signal<boolean>(false);
  readonly cancelError = signal<string | null>(null);

  readonly rebuyingOrderId = signal<number | null>(null);

  readonly searchControl = new FormControl<string>('', { nonNullable: true });

  readonly pageNumbers = computed(() => {
    const count = this.totalPages();
    return Array.from({ length: count }, (_, idx) => idx);
  });

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const rawStatus = params.get('status');
        const nextStatus: OrderStatusFilter = isValidOrderStatusFilter(rawStatus)
          ? rawStatus
          : 'ALL';
        const nextQuery = (params.get('q') ?? '').trim();
        const rawPage = Number(params.get('page') ?? '0');
        const nextPage = Number.isInteger(rawPage) && rawPage >= 0 ? rawPage : 0;

        this.activeStatus.set(nextStatus);
        this.searchKeyword.set(nextQuery);
        this.page.set(nextPage);

        if (this.searchControl.value !== nextQuery) {
          this.searchControl.setValue(nextQuery, { emitEvent: false });
        }

        this.fetchOrders();
      });

    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((keyword) => {
        this.updateQueryParams({
          status: this.activeStatus(),
          q: keyword.trim(),
          page: 0,
        });
      });
  }

  fetchOrders(): void {
    this.loading.set(true);
    this.error.set(null);

    const statusParam = this.activeStatus();
    this.ordersApi
      .listOrders({
        status: statusParam === 'ALL' ? undefined : statusParam,
        q: this.searchKeyword() || undefined,
        page: this.page(),
        size: DEFAULT_PAGE_SIZE,
      })
      .subscribe({
        next: (res) => {
          this.orders.set(res.content ?? []);
          this.totalPages.set(res.totalPages ?? 0);
          this.totalElements.set(res.totalElements ?? 0);
          this.countsByStatus.set(res.countsByStatus);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err);
          this.loading.set(false);
        },
      });
  }

  onStatusChange(status: OrderStatusFilter): void {
    this.updateQueryParams({
      status,
      q: this.searchKeyword(),
      page: 0,
    });
  }

  onPageChange(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages() || nextPage === this.page()) {
      return;
    }
    this.updateQueryParams({
      status: this.activeStatus(),
      q: this.searchKeyword(),
      page: nextPage,
    });
  }

  onViewDetail(order: CustomerOrder): void {
    void this.router.navigate(['/account/orders', order.id]);
  }

  promptCancelOrder(order: CustomerOrder): void {
    this.cancelError.set(null);
    this.cancelingOrder.set(order);
  }

  closeCancelDialog(): void {
    if (!this.cancelingLoading()) {
      this.cancelingOrder.set(null);
      this.cancelError.set(null);
    }
  }

  confirmCancelOrder(reason: string): void {
    const target = this.cancelingOrder();
    if (!target) {
      return;
    }
    this.cancelingLoading.set(true);
    this.cancelError.set(null);

    this.ordersApi.cancelOrder(target.id, { reason }).subscribe({
      next: () => {
        this.cancelingLoading.set(false);
        this.cancelingOrder.set(null);
        this.toastService.success('Đã hủy đơn hàng thành công.');
        this.fetchOrders();
      },
      error: (err: ApiError) => {
        this.cancelingLoading.set(false);
        this.cancelError.set(err.message);
      },
    });
  }

  onRebuyOrder(order: CustomerOrder): void {
    this.rebuyingOrderId.set(order.id);
    this.ordersApi.rebuyOrder(order.id).subscribe({
      next: (res) => {
        this.rebuyingOrderId.set(null);
        const count = res?.addedItemCount ?? order.items.length;
        this.toastService.success(`Đã thêm ${count} sản phẩm vào giỏ hàng.`);
      },
      error: (err: ApiError) => {
        this.rebuyingOrderId.set(null);
        this.toastService.error(err.message);
      },
    });
  }

  private updateQueryParams(state: {
    status: OrderStatusFilter;
    q: string;
    page: number;
  }): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: state.status === 'ALL' ? null : state.status,
        q: state.q ? state.q : null,
        page: state.page > 0 ? state.page : null,
      },
      queryParamsHandling: 'merge',
    });
  }
}
