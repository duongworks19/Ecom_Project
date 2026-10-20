import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ShipperListItem,
  getShipperInitial,
  maskPhoneNumber,
} from '../../../../models/shipper.models';

@Component({
  selector: 'vic-shippers-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shippers-table.component.html',
  styleUrl: './shippers-table.component.scss',
})
export class ShippersTableComponent {
  @Input() shippers: ShipperListItem[] = [];
  @Input() selectedShipperId: number | null = null;
  @Output() selectShipper = new EventEmitter<ShipperListItem>();

  readonly maskPhone = maskPhoneNumber;
  readonly getInitial = getShipperInitial;

  getStatusClass(shipper: ShipperListItem): string {
    if (shipper.accountStatus === 'LOCKED') return 'locked';
    if (shipper.workStatus === 'AVAILABLE') return 'available';
    if (shipper.workStatus === 'BUSY') return 'busy';
    return 'offline';
  }

  getStatusLabel(shipper: ShipperListItem): string {
    if (shipper.accountStatus === 'LOCKED') return 'Đã khóa';
    if (shipper.workStatus === 'AVAILABLE') return 'Sẵn sàng';
    if (shipper.workStatus === 'BUSY') return 'Đang giao';
    return 'Nghỉ';
  }
}
