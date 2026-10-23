import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Shipment } from '../../models/shipper.models';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-pickup',
  standalone: true,
  imports: [CommonModule, ShipmentDetailDialogComponent],
  templateUrl: './shipper-pickup.component.html',
  styleUrl: './shipper-pickup.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperPickupComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  private readonly toastService = inject(ToastService);

  readonly pickupShipments = signal<Shipment[]>([]);
  readonly activeDetailShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.pickupShipments.set(list.filter((s) => s.status === 'READY_TO_PICK'));
    });
  }

  onConfirmPickup(item: Shipment): void {
    this.shipperService.confirmPickup(item.id).subscribe({
      next: (res) => {
        this.toastService.success(`Đã lấy kiện hàng ${res.code} thành công! Đơn chuyển sang đang giao.`);
      },
      error: () => this.toastService.error('Có lỗi xảy ra khi xác nhận lấy hàng'),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
