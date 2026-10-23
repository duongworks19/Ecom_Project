import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { FailureReason, Shipment, ShipmentStatus, ShipperKPI } from '../../models/shipper.models';
import { ConfirmDeliveryDialogComponent } from '../../components/confirm-delivery-dialog/confirm-delivery-dialog.component';
import { ReportFailureDialogComponent } from '../../components/report-failure-dialog/report-failure-dialog.component';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDeliveryDialogComponent,
    ReportFailureDialogComponent,
    ShipmentDetailDialogComponent,
  ],
  templateUrl: './shipper-dashboard.component.html',
  styleUrl: './shipper-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperDashboardComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  private readonly toastService = inject(ToastService);

  readonly kpi = signal<ShipperKPI>({
    readyToPickCount: 0,
    deliveringCount: 0,
    deliveredCount: 0,
    failedCount: 0,
    totalCollectedCod: 0,
    successRate: 100,
  });

  readonly shipments = signal<Shipment[]>([]);
  readonly currentFilter = signal<ShipmentStatus | 'ALL'>('ALL');

  // Dialog States
  readonly activeDetailShipment = signal<Shipment | null>(null);
  readonly activeDeliveryShipment = signal<Shipment | null>(null);
  readonly activeFailureShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.shipments.set(list);
      this.refreshKPI();
    });
    this.refreshKPI();
  }

  refreshKPI(): void {
    this.shipperService.getKPI().subscribe((kpi) => {
      this.kpi.set(kpi);
    });
  }

  setFilter(filter: ShipmentStatus | 'ALL'): void {
    this.currentFilter.set(filter);
  }

  get filteredShipments(): Shipment[] {
    const list = this.shipments();
    const filter = this.currentFilter();
    if (filter === 'ALL') return list;
    return list.filter((s) => s.status === filter);
  }

  onConfirmPickup(item: Shipment): void {
    this.shipperService.confirmPickup(item.id).subscribe({
      next: (res) => {
        this.toastService.success(`Đã nhận kiện hàng ${res.code}. Đơn đã chuyển sang trạng thái đang giao!`);
      },
      error: () => this.toastService.error('Có lỗi khi cập nhật lấy hàng'),
    });
  }

  openDeliveryModal(item: Shipment): void {
    this.activeDeliveryShipment.set(item);
  }

  handleDeliveryConfirmed(event: { id: number; collectedCod: number }): void {
    this.shipperService.confirmDelivered(event.id, event.collectedCod).subscribe({
      next: (res) => {
        this.activeDeliveryShipment.set(null);
        this.toastService.success(`Đã hoàn tất giao đơn ${res.code}! Ghi nhận COD: ${this.formatCurrency(event.collectedCod)}`);
      },
      error: () => this.toastService.error('Có lỗi khi xác nhận giao hàng'),
    });
  }

  openFailureModal(item: Shipment): void {
    this.activeFailureShipment.set(item);
  }

  handleFailureReported(event: { id: number; reason: FailureReason; notes: string }): void {
    this.shipperService.reportDeliveryFailure(event.id, event.reason, event.notes).subscribe({
      next: (res) => {
        this.activeFailureShipment.set(null);
        this.toastService.info(`Đã báo cáo giao thất bại đơn ${res.code}. Vụ việc đã được chuyển điều phối.`);
      },
      error: () => this.toastService.error('Có lỗi khi báo cáo thất bại'),
    });
  }

  openDetailModal(item: Shipment): void {
    this.activeDetailShipment.set(item);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
