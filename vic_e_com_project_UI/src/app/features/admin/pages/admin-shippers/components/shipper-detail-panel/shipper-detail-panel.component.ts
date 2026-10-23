import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  ShipperDetail,
  getShipperInitial,
  maskPhoneNumber,
} from '../../../../models/shipper.models';

@Component({
  selector: 'vic-shipper-detail-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './shipper-detail-panel.component.html',
  styleUrl: './shipper-detail-panel.component.scss',
})
export class ShipperDetailPanelComponent {
  @Input() shipper: ShipperDetail | null = null;
  @Output() requestToggleLock = new EventEmitter<ShipperDetail>();
  @Output() viewAllHistory = new EventEmitter<ShipperDetail>();
  @Output() requestDelete = new EventEmitter<ShipperDetail>();

  readonly maskPhone = maskPhoneNumber;
  readonly getInitial = getShipperInitial;

  getStatusClass(shipper: ShipperDetail): string {
    if (shipper.accountStatus === 'LOCKED') return 'locked';
    if (shipper.workStatus === 'AVAILABLE') return 'available';
    if (shipper.workStatus === 'BUSY') return 'busy';
    return 'offline';
  }

  getDetailStatusText(shipper: ShipperDetail): string {
    if (shipper.accountStatus === 'LOCKED') return 'Đã khóa';
    if (shipper.workStatus === 'BUSY') return `Đang giao ${shipper.deliveringCount} đơn`;
    if (shipper.workStatus === 'AVAILABLE') return 'Sẵn sàng';
    return 'Nghỉ';
  }

  formatRate(rate: number| null | undefined): string {
    if (rate === null || rate === undefined) {
      return '0,0';
    }
    return rate.toFixed(1).replace('.', ',');
  }

  getDeliveryStatusLabel(status: string): string {
    if (status === 'DELIVERED') return 'Đã giao';
    if (status === 'FAILED') return 'Giao thất bại';
    return 'Đang giao';
  }
}
