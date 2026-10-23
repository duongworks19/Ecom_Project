import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { FailureReason, Shipment } from '../../models/shipper.models';
import { ConfirmDeliveryDialogComponent } from '../../components/confirm-delivery-dialog/confirm-delivery-dialog.component';
import { ReportFailureDialogComponent } from '../../components/report-failure-dialog/report-failure-dialog.component';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-delivering',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDeliveryDialogComponent,
    ReportFailureDialogComponent,
    ShipmentDetailDialogComponent,
  ],
  templateUrl: './shipper-delivering.component.html',
  styleUrl: './shipper-delivering.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperDeliveringComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  private readonly toastService = inject(ToastService);

  readonly deliveringShipments = signal<Shipment[]>([]);
  readonly activeDetailShipment = signal<Shipment | null>(null);
  readonly activeDeliveryShipment = signal<Shipment | null>(null);
  readonly activeFailureShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.deliveringShipments.set(list.filter((s) => s.status === 'DELIVERING'));
    });
  }

  handleDeliveryConfirmed(event: { id: number; collectedCod: number }): void {
    this.shipperService.confirmDelivered(event.id, event.collectedCod).subscribe({
      next: (res) => {
        this.activeDeliveryShipment.set(null);
        this.toastService.success(`Đã giao đơn ${res.code} thành công! COD: ${this.formatCurrency(event.collectedCod)}`);
      },
      error: () => this.toastService.error('Có lỗi xảy ra khi xác nhận giao hàng'),
    });
  }

  handleFailureReported(event: { id: number; reason: FailureReason; notes: string }): void {
    this.shipperService.reportDeliveryFailure(event.id, event.reason, event.notes).subscribe({
      next: (res) => {
        this.activeFailureShipment.set(null);
        this.toastService.info(`Đã báo sự cố giao thất bại đơn ${res.code}. Vụ việc đã được chuyển điều phối.`);
      },
      error: () => this.toastService.error('Có lỗi khi báo sự cố'),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
