import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderItem } from '../../services/admin-orders.service';
import { AdminShipmentData, AdminShipperItem, AdminShipmentsService } from '../../services/admin-shipments.service';

@Component({
  selector: 'vic-admin-shipments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-shipments.component.html',
  styleUrl: './admin-shipments.component.scss',
})
export class AdminShipmentsComponent implements OnInit {
  private shipmentService = inject(AdminShipmentsService);

  readonly orders = signal<AdminOrderItem[]>([]);
  readonly shippers = signal<AdminShipperItem[]>([]);
  readonly awaitingCount = signal<number>(0);
  readonly shippingCount = signal<number>(0);
  readonly totalShippers = signal<number>(0);

  readonly isLoading = signal<boolean>(true);
  readonly toastMessage = signal<string | null>(null);

  // Assign modal
  assigningOrder: AdminOrderItem | null = null;
  selectedShipperId: number | null = null;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.shipmentService.getShipments().subscribe({
      next: (res) => {
        const d: AdminShipmentData = res.data;
        this.orders.set(d.orders || []);
        this.shippers.set(d.shippers || []);
        this.awaitingCount.set(d.awaitingShipperCount || 0);
        this.shippingCount.set(d.shippingCount || 0);
        this.totalShippers.set(d.totalShippers || 0);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openAssignModal(order: AdminOrderItem): void {
    this.assigningOrder = order;
    this.selectedShipperId = this.shippers().length > 0 ? this.shippers()[0].id : null;
  }

  closeModal(): void {
    this.assigningOrder = null;
  }

  confirmAssign(): void {
    if (!this.assigningOrder || !this.selectedShipperId) return;
    this.shipmentService.assignShipper(this.assigningOrder.id, this.selectedShipperId).subscribe({
      next: (res) => {
        this.showToast(`Đã gán shipper thành công cho đơn ${this.assigningOrder?.orderCode}`);
        this.closeModal();
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Lỗi khi gán shipper'),
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3500);
  }
}
