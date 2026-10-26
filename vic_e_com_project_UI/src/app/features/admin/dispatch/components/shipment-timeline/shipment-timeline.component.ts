import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { DisplayStatus, ShipmentEvent } from '../../models/dispatch.models';

@Component({
  selector: 'vic-shipment-timeline',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './shipment-timeline.component.html',
  styleUrl: './shipment-timeline.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentTimelineComponent {
  readonly events = input<ShipmentEvent[]>([]);
  readonly displayStatus = input<DisplayStatus>('WAITING');

  getEventTitle(status: string): string {
    switch (status) {
      case 'READY_TO_SHIP':
        return 'Sẵn sàng giao';
      case 'ASSIGNED':
        return 'Đã gán';
      case 'PICKED_UP':
        return 'Đã lấy hàng';
      case 'DELIVERING':
        return 'Đang giao';
      case 'FAILED':
        return 'Thất bại';
      case 'DELIVERED':
        return 'Đã giao';
      case 'CANCELLED':
        return 'Đã hoàn / hủy';
      default:
        return status;
    }
  }
}
