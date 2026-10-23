import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { Shipment } from '../../models/shipper.models';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-history',
  standalone: true,
  imports: [CommonModule, ShipmentDetailDialogComponent],
  templateUrl: './shipper-history.component.html',
  styleUrl: './shipper-history.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperHistoryComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);

  readonly historyList = signal<Shipment[]>([]);
  readonly activeDetailShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.historyList.set(list.filter((s) => s.status === 'DELIVERED' || s.status === 'FAILED'));
    });
  }

  getLastEventTime(item: Shipment): string {
    const last = item.events[item.events.length - 1];
    return last ? last.time : '--';
  }

  getLastEventDesc(item: Shipment): string {
    const last = item.events[item.events.length - 1];
    return last ? last.title : '--';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
