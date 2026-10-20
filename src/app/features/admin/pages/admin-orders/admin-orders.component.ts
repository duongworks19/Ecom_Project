import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderItem, AdminOrderResponse, AdminOrdersService } from '../../services/admin-orders.service';

@Component({
  selector: 'vic-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrl: './admin-orders.component.scss',
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(AdminOrdersService);

  readonly orders = signal<AdminOrderItem[]>([]);
  readonly response = signal<AdminOrderResponse>({
    items: [],
    total: 0,
    page: 0,
    size: 10,
    totalPages: 0,
    summaryTotal: 0,
    summaryPending: 0,
    summaryPreparing: 0,
    summaryShipping: 0,
    summaryDelivered: 0,
  });

  readonly isLoading = signal<boolean>(true);
  readonly toastMessage = signal<string | null>(null);

  keyword = '';
  selectedStatus = 'ALL';
  page = 0;
  size = 10;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.orderService.getOrders(this.keyword, this.selectedStatus, this.page, this.size).subscribe({
      next: (res) => {
        this.response.set(res.data);
        this.orders.set(res.data.items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSearch(): void {
    this.page = 0;
    this.loadData();
  }

  onFilterStatus(st: string): void {
    this.selectedStatus = st;
    this.page = 0;
    this.loadData();
  }

  changeStatus(order: AdminOrderItem, newStatus: string): void {
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: (res) => {
        order.status = res.data.status;
        order.statusLabel = res.data.statusLabel;
        order.badgeClass = res.data.badgeClass;
        this.showToast(`Đã cập nhật trạng thái đơn ${order.orderCode} thành ${order.statusLabel}`);
        this.loadData();
      },
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3500);
  }
}
