import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VndCurrencyPipe } from '../../../../../../shared/pipes/vnd-currency.pipe';
import { AdminOrderDetail, AdminOrderItem } from '../../models/admin-orders.model';

@Component({
  selector: 'vic-admin-order-detail',
  standalone: true,
  imports: [RouterLink, VndCurrencyPipe],
  templateUrl: './admin-order-detail.component.html',
  styleUrl: './admin-order-detail.component.scss',
})
export class AdminOrderDetailComponent {
  readonly detail = input<AdminOrderDetail | null>(null);
  readonly selectedItem = input<AdminOrderItem | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);
  readonly isOpen = input<boolean>(false);

  readonly closePanel = output<void>();

  onClose(): void {
    this.closePanel.emit();
  }

  formatDate(isoDate: string | null | undefined): string {
    if (!isoDate) {
      return 'Chưa có thời gian';
    }
    const d = new Date(isoDate);
    if (Number.isNaN(d.getTime())) {
      return isoDate;
    }
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month} · ${hours}:${mins}`;
  }
}

