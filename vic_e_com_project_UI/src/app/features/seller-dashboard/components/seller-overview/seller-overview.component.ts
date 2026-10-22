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
import {
  SellerDashboardData,
  SellerNavTab,
  SellerRecentOrder,
  OrderFilterType,
  SellerReturnRequest,
  SellerQaQuestion,
} from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-overview',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './seller-overview.component.html',
  styleUrl: './seller-overview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOverviewComponent {
  readonly data = input.required<SellerDashboardData>();
  readonly returnsList = input<SellerReturnRequest[]>([]);
  readonly qaList = input<SellerQaQuestion[]>([]);

  readonly navSelect = output<SellerNavTab>();
  readonly orderAction = output<{ orderCode: string; action: string; reason?: string }>();
  readonly openRestock = output<{ productId: number; name: string }>();
  readonly openAddProduct = output<void>();

  readonly orderFilter = signal<'ALL' | 'PENDING' | 'PREPARING'>('PENDING');

  // Reject modal state
  readonly showRejectModal = signal<boolean>(false);
  readonly targetOrderForReject = signal<string | null>(null);
  readonly rejectReasonText = signal<string>('');
  readonly rejectError = signal<string | null>(null);

  readonly quickReasons = [
    'Hết hàng',
    'Sản phẩm ngừng bán',
    'Không giao được tới khu vực này',
  ];

  readonly pendingOrders = computed(() =>
    this.data().recentOrders.filter((o) => o.status === 'PENDING_CONFIRMATION')
  );

  readonly preparingOrders = computed(() =>
    this.data().recentOrders.filter((o) => o.status === 'PREPARING')
  );

  readonly pendingReturnsCount = computed(() =>
    this.returnsList().filter((r) => r.status === 'PENDING').length
  );

  readonly unansweredQaCount = computed(() =>
    this.qaList().filter((q) => !q.answer).length
  );

  readonly todoCount = computed(() => {
    return (
      this.pendingOrders().length +
      this.preparingOrders().length +
      this.pendingReturnsCount() +
      this.data().lowStockProducts.length +
      this.unansweredQaCount()
    );
  });

  readonly displayOrders = computed(() => {
    const orders = this.data().recentOrders;
    const filter = this.orderFilter();
    if (filter === 'ALL') {
      return orders.filter((o) =>
        ['PENDING_CONFIRMATION', 'PREPARING', 'PACKED'].includes(o.status)
      );
    }
    if (filter === 'PENDING') {
      return orders.filter((o) => o.status === 'PENDING_CONFIRMATION');
    }
    return orders.filter((o) => o.status === 'PREPARING');
  });

  readonly readyToShipOrders = computed(() =>
    this.data().recentOrders.filter((o) => o.status === 'PACKED')
  );

  readonly shopShortName = computed(() => {
    const name = this.data().shopName;
    return name.split(' ')[0] || name;
  });

  setFilter(filter: 'ALL' | 'PENDING' | 'PREPARING'): void {
    this.orderFilter.set(filter);
  }

  onConfirmOrder(orderCode: string): void {
    this.orderAction.emit({ orderCode, action: 'CONFIRM' });
  }

  onPackedOrder(orderCode: string): void {
    this.orderAction.emit({ orderCode, action: 'MARK_PACKED' });
  }

  onOpenRejectModal(orderCode: string): void {
    this.targetOrderForReject.set(orderCode);
    this.rejectReasonText.set('');
    this.rejectError.set(null);
    this.showRejectModal.set(true);
  }

  onSelectQuickReason(reason: string): void {
    this.rejectReasonText.set(`${reason}.`);
  }

  onConfirmReject(): void {
    const text = this.rejectReasonText().trim();
    if (text.length < 5) {
      this.rejectError.set('Nêu lý do từ chối (tối thiểu 5 ký tự).');
      return;
    }
    const orderCode = this.targetOrderForReject();
    if (orderCode) {
      this.orderAction.emit({ orderCode, action: 'CANCEL', reason: text });
    }
    this.showRejectModal.set(false);
  }

  onCloseRejectModal(): void {
    this.showRejectModal.set(false);
  }
}
