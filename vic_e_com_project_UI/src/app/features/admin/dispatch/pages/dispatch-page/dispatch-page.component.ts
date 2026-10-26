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
import { forkJoin, timer } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DispatchApiService } from '../../services/dispatch-api.service';
import {
  DispatchDetail,
  DispatchItem,
  DispatchSummary,
  ResolutionAction,
} from '../../models/dispatch.models';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { DispatchStatusBarComponent } from '../../components/dispatch-status-bar/dispatch-status-bar.component';
import { DispatchKpiCardsComponent } from '../../components/dispatch-kpi-cards/dispatch-kpi-cards.component';
import { ShipperRosterComponent } from '../../components/shipper-roster/shipper-roster.component';
import { DispatchFilterBarComponent } from '../../components/dispatch-filter-bar/dispatch-filter-bar.component';
import { DispatchListComponent } from '../../components/dispatch-list/dispatch-list.component';
import { DispatchDetailComponent } from '../../components/dispatch-detail/dispatch-detail.component';

@Component({
  selector: 'vic-dispatch-page',
  standalone: true,
  imports: [
    DispatchStatusBarComponent,
    DispatchKpiCardsComponent,
    ShipperRosterComponent,
    DispatchFilterBarComponent,
    DispatchListComponent,
    DispatchDetailComponent,
  ],
  templateUrl: './dispatch-page.component.html',
  styleUrl: './dispatch-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchPageComponent implements OnInit {
  private readonly dispatchApi = inject(DispatchApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  readonly summary = signal<DispatchSummary | null>(null);
  readonly allItems = signal<DispatchItem[]>([]);
  readonly selectedOrderId = signal<number | null>(null);
  readonly selectedDetail = signal<DispatchDetail | null>(null);

  readonly statusFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly loading = signal<boolean>(true);
  readonly actionLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly counts = computed(() => {
    return this.summary()?.counts || { waiting: 0, delivering: 0, failed: 0, delivered: 0 };
  });

  readonly shippers = computed(() => this.summary()?.shippers || []);
  readonly availableShippers = computed(() => {
    return this.shippers().filter((s) => s.workStatus === 'AVAILABLE');
  });

  readonly isRunning = computed(() => this.summary()?.running ?? true);
  readonly lastScanAt = computed(() => this.summary()?.lastScanAt || null);

  readonly filteredItems = computed(() => {
    const raw = this.allItems();
    const status = this.statusFilter();
    const query = this.searchQuery().trim().toLowerCase();

    return raw.filter((item) => {
      const matchStatus = status === 'ALL' || item.displayStatus === status;
      if (!matchStatus) return false;
      if (!query) return true;

      const code = item.orderCode?.toLowerCase() || '';
      const receiver = item.receiverName?.toLowerCase() || '';
      const phone = item.receiverPhone || '';
      const district = item.district?.toLowerCase() || '';

      return code.includes(query) || receiver.includes(query) || phone.includes(query) || district.includes(query);
    });
  });

  ngOnInit(): void {
    // ponytail: 15s polling interval, can be upgraded to Server-Sent Events (SSE) or WebSockets in the future.
    timer(0, 15000)
      .pipe(
        filter(() => typeof document === 'undefined' || !document.hidden),
        switchMap(() => this.fetchData(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }

  fetchData(isInitial = false) {
    if (isInitial) {
      this.loading.set(true);
      this.error.set(null);
    }

    return forkJoin({
      summary: this.dispatchApi.getSummary(),
      itemsPage: this.dispatchApi.getItems('ALL', 0, 100),
    }).pipe(
      switchMap(({ summary, itemsPage }) => {
        this.summary.set(summary);
        this.allItems.set(itemsPage.content);
        this.loading.set(false);
        this.error.set(null);

        const currentId = this.selectedOrderId();
        if (currentId) {
          return this.dispatchApi.getDetail(currentId);
        } else if (itemsPage.content.length > 0) {
          const first = itemsPage.content[0];
          this.selectedOrderId.set(first.orderId);
          return this.dispatchApi.getDetail(first.orderId);
        }
        return [null];
      }),
      switchMap((detail) => {
        if (detail) {
          this.selectedDetail.set(detail);
        }
        return [null];
      })
    );
  }

  loadDetail(orderId: number): void {
    this.selectedOrderId.set(orderId);
    this.dispatchApi.getDetail(orderId).subscribe({
      next: (detail) => this.selectedDetail.set(detail),
      error: (err) => this.toast.error(err.message || 'Không thể tải chi tiết đơn hàng'),
    });
  }

  onSelectStatus(status: string): void {
    this.statusFilter.set(status);
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }

  onSelectItem(item: DispatchItem): void {
    this.loadDetail(item.orderId);
  }

  onResolveFailure(event: { action: ResolutionAction; note?: string }): void {
    const orderId = this.selectedOrderId();
    if (!orderId) return;

    this.actionLoading.set(true);
    this.dispatchApi.resolveFailure(orderId, event).subscribe({
      next: (updatedDetail) => {
        this.selectedDetail.set(updatedDetail);
        this.actionLoading.set(false);
        this.toast.success(`Đã thực hiện thao tác ${event.action} thành công!`);
        this.fetchData(false).subscribe();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  onManualAssign(shipperId: number): void {
    const orderId = this.selectedOrderId();
    if (!orderId) return;

    this.actionLoading.set(true);
    this.dispatchApi.manualAssign(orderId, { shipperId }).subscribe({
      next: (updatedDetail) => {
        this.selectedDetail.set(updatedDetail);
        this.actionLoading.set(false);
        this.toast.success('Đã gán shipper cho đơn hàng thành công!');
        this.fetchData(false).subscribe();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.toast.error(err.message);
      },
    });
  }

  onRetry(): void {
    this.fetchData(true).subscribe();
  }
}
