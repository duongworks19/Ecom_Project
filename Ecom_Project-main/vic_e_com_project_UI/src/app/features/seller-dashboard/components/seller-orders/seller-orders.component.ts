import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerRecentOrder } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-orders',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './seller-orders.component.html',
  styleUrl: './seller-orders.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOrdersComponent {
  readonly orders = input.required<SellerRecentOrder[]>();
  readonly orderAction = output<{ orderCode: string; action: string; reason?: string }>();

  readonly daysFilter = signal<'0' | '7' | 'ALL'>('ALL');
  readonly statusFilter = signal<string>('ALL');
  readonly searchQuery = signal<string>('');

  // Modals
  readonly selectedOrderForDetail = signal<SellerRecentOrder | null>(null);
  readonly showRejectModal = signal<boolean>(false);
  readonly targetOrderForReject = signal<string | null>(null);
  readonly rejectReasonText = signal<string>('');
  readonly rejectError = signal<string | null>(null);

  readonly quickReasons = [
    'Hết hàng',
    'Sản phẩm ngừng bán',
    'Không giao được tới khu vực này',
  ];

  readonly statusTabs = [
    { key: 'ALL', label: 'Tất cả' },
    { key: 'PENDING_CONFIRMATION', label: 'Chờ xác nhận' },
    { key: 'PREPARING', label: 'Đang chuẩn bị' },
    { key: 'PACKED', label: 'Đã đóng gói' },
    { key: 'READY_TO_SHIP', label: 'Sẵn sàng giao' },
    { key: 'COMPLETED', label: 'Đã giao' },
  ];

  readonly filteredOrders = computed(() => {
    const list = this.orders();
    const st = this.statusFilter();
    const q = this.searchQuery().trim().toLowerCase();

    return list.filter((o) => {
      const matchSt = st === 'ALL' || o.status === st;
      const matchQuery =
        !q ||
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q);
      return matchSt && matchQuery;
    });
  });

  getCount(statusKey: string): number {
    if (statusKey === 'ALL') return this.orders().length;
    return this.orders().filter((o) => o.status === statusKey).length;
  }

  onConfirm(code: string): void {
    this.orderAction.emit({ orderCode: code, action: 'CONFIRM' });
  }

  onPacked(code: string): void {
    this.orderAction.emit({ orderCode: code, action: 'MARK_PACKED' });
  }

  onReadyToShip(code: string): void {
    this.orderAction.emit({ orderCode: code, action: 'READY_TO_SHIP' });
  }

  openRejectModal(code: string): void {
    this.targetOrderForReject.set(code);
    this.rejectReasonText.set('');
    this.rejectError.set(null);
    this.showRejectModal.set(true);
  }

  selectQuickReason(reason: string): void {
    this.rejectReasonText.set(`${reason}.`);
  }

  confirmReject(): void {
    const text = this.rejectReasonText().trim();
    if (text.length < 5) {
      this.rejectError.set('Nhập lý do từ chối (tối thiểu 5 ký tự).');
      return;
    }
    const code = this.targetOrderForReject();
    if (code) {
      this.orderAction.emit({ orderCode: code, action: 'CANCEL', reason: text });
    }
    this.showRejectModal.set(false);
  }

  openDetail(order: SellerRecentOrder): void {
    this.selectedOrderForDetail.set(order);
  }

  closeDetail(): void {
    this.selectedOrderForDetail.set(null);
  }
}
