import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SellerRecentOrder } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-recent-orders-table',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './recent-orders-table.component.html',
  styleUrl: './recent-orders-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentOrdersTableComponent {
  readonly title = input<string>('Đơn hàng mới');
  readonly showViewAll = input<boolean>(true);
  readonly orders = input.required<SellerRecentOrder[]>();

  readonly viewAllClick = output<void>();
  readonly orderAction = output<SellerRecentOrder>();
  readonly viewOrderDetail = output<SellerRecentOrder>();

  readonly failedImages = signal<Record<string, boolean>>({});

  onImageError(orderCode: string): void {
    this.failedImages.update((prev) => ({ ...prev, [orderCode]: true }));
  }

  onViewAll(event: Event): void {
    event.preventDefault();
    this.viewAllClick.emit();
  }

  onActionClick(order: SellerRecentOrder, event: Event): void {
    event.stopPropagation();
    if (order.nextAction === 'VIEW_DETAIL') {
      this.viewOrderDetail.emit(order);
      return;
    }
    this.orderAction.emit(order);
  }

  onRowClick(order: SellerRecentOrder): void {
    this.viewOrderDetail.emit(order);
  }
}
