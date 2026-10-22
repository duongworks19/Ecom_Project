import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import { ShipperService } from '../../services/shipper.service';
import {
  ShipperDetail,
  ShipperDeliveryItem,
  ShipperFilterStatus,
  ShipperListItem,
  ShipperSummary,
} from '../../models/shipper.models';
import { ShippersKpiComponent } from './components/shippers-kpi/shippers-kpi.component';
import { ShippersFilterBarComponent } from './components/shippers-filter-bar/shippers-filter-bar.component';
import { ShippersTableComponent } from './components/shippers-table/shippers-table.component';
import { ShipperDetailPanelComponent } from './components/shipper-detail-panel/shipper-detail-panel.component';
import { ShipperLockModalComponent } from './components/shipper-lock-modal/shipper-lock-modal.component';

@Component({
  selector: 'vic-admin-shippers',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ShippersKpiComponent,
    ShippersFilterBarComponent,
    ShippersTableComponent,
    ShipperDetailPanelComponent,
    ShipperLockModalComponent,
  ],
  templateUrl: './admin-shippers.component.html',
  styleUrl: './admin-shippers.component.scss',
})
export class AdminShippersComponent implements OnInit {
  private readonly shipperService = inject(ShipperService);
  private readonly route = inject(ActivatedRoute);

  readonly summary = signal<ShipperSummary>({
    total: 0,
    available: 0,
    busy: 0,
    locked: 0,
    deliveringOrders: 0,
  });
  readonly shippers = signal<ShipperListItem[]>([]);
  readonly selectedShipper = signal<ShipperDetail | null>(null);
  readonly isLoading = signal<boolean>(true);
  readonly pageError = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly lockModalShipper = signal<ShipperDetail | null>(null);
  readonly lockModalError = signal<string | null>(null);
  readonly isLockSubmitting = signal<boolean>(false);

  readonly historyModalShipper = signal<ShipperDetail | null>(null);
  readonly fullDeliveries = signal<ShipperDeliveryItem[]>([]);
  readonly currentPage = signal(0);
  readonly pageSize = 10;
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);

  private currentKeyword = '';
  private currentStatus: ShipperFilterStatus = 'ALL';

  ngOnInit(): void {
    const notice = this.route.snapshot.queryParamMap.get('notice');
    if (notice) {
      this.showToast(notice);
    }
    this.loadData(2);
  }

  onFilterChanged(filter: { keyword: string; status: ShipperFilterStatus }): void {
    this.currentKeyword = filter.keyword;
    this.currentStatus = filter.status;
    this.currentPage.set(0);
    this.loadData(this.selectedShipper()?.id);
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages()) return;
    this.currentPage.set(page);
    this.loadData();
  }

  onSelectShipper(item: ShipperListItem): void {
    this.shipperService.getShipperDetail(item.id).subscribe({
      next: (detail) => this.selectedShipper.set(detail),
      error: () => this.showToast('Không thể tải chi tiết shipper'),
    });
  }

  onOpenLockModal(shipper: ShipperDetail): void {
    this.lockModalError.set(null);
    this.lockModalShipper.set(shipper);
  }

  onConfirmToggleLock(event: { shipper: ShipperDetail; reason: string }): void {
    const { shipper, reason } = event;
    this.isLockSubmitting.set(true);
    this.lockModalError.set(null);

    const req$ =
      shipper.accountStatus === 'LOCKED'
        ? this.shipperService.unlockShipper(shipper.id)
        : this.shipperService.lockShipper(shipper.id, reason);

    req$.subscribe({
      next: (updated) => {
        this.isLockSubmitting.set(false);
        this.lockModalShipper.set(null);
        this.selectedShipper.set(updated);
        this.showToast(
          updated.accountStatus === 'LOCKED'
            ? `Đã khóa tài khoản ${updated.fullName}`
            : `Đã mở khóa tài khoản ${updated.fullName}`
        );
        this.loadData(updated.id);
      },
      error: (err: HttpErrorResponse) => {
        this.isLockSubmitting.set(false);
        this.lockModalError.set(
          err.error?.message || 'Không thể thực hiện thao tác trên tài khoản shipper này.'
        );
      },
    });
  }

  onOpenHistory(shipper: ShipperDetail): void {
    this.historyModalShipper.set(shipper);
    this.shipperService.getDeliveries(shipper.id, 0, 20).subscribe({
      next: (res) => this.fullDeliveries.set(res.items),
    });
  }

  private loadData(preferredId?: number): void {
    this.isLoading.set(true);
    this.pageError.set(null);

    forkJoin({
      summary: this.shipperService.getSummary(),
      list: this.shipperService.getShippers({
        keyword: this.currentKeyword,
        status: this.currentStatus,
        page: this.currentPage(),
        size: this.pageSize,
      }),
    }).subscribe({
      next: ({ summary, list }) => {
        this.summary.set(summary);
        this.shippers.set(list.items);
        this.totalElements.set(list.totalElements ?? list.total);
        this.totalPages.set(list.totalPages ?? Math.ceil((list.totalElements ?? list.total) / this.pageSize));
        this.isLoading.set(false);

        const targetId =
          list.items.find((i) => i.id === preferredId)?.id ?? list.items[0]?.id ?? null;
        if (targetId !== null) {
          this.shipperService.getShipperDetail(targetId).subscribe({
            next: (detail) => this.selectedShipper.set(detail),
          });
        } else {
          this.selectedShipper.set(null);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.pageError.set('Không thể tải dữ liệu shipper. Vui lòng thử lại.');
      },
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3500);
  }
}
