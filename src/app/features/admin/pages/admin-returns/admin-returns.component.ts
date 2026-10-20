import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminOrderItem } from '../../services/admin-orders.service';
import { AdminReturnResponse, AdminReturnsService } from '../../services/admin-returns.service';

@Component({
  selector: 'vic-admin-returns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-returns.component.html',
  styleUrl: './admin-returns.component.scss',
})
export class AdminReturnsComponent implements OnInit {
  private returnService = inject(AdminReturnsService);

  readonly returns = signal<AdminOrderItem[]>([]);
  readonly response = signal<AdminReturnResponse>({
    items: [],
    total: 0,
    summaryPending: 0,
    summaryCompleted: 0,
  });

  readonly isLoading = signal<boolean>(true);
  readonly toastMessage = signal<string | null>(null);

  // Review modal
  reviewingItem: AdminOrderItem | null = null;
  reviewAction: 'APPROVE' | 'REJECT' = 'APPROVE';
  reviewNote = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.returnService.getReturns().subscribe({
      next: (res) => {
        this.response.set(res.data);
        this.returns.set(res.data.items || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openReviewModal(item: AdminOrderItem, action: 'APPROVE' | 'REJECT'): void {
    this.reviewingItem = item;
    this.reviewAction = action;
    this.reviewNote = action === 'APPROVE' ? 'Đã xác nhận lỗi từ phía đóng gói/sản phẩm' : 'Sản phẩm không đủ điều kiện đổi trả';
  }

  closeModal(): void {
    this.reviewingItem = null;
  }

  confirmReview(): void {
    if (!this.reviewingItem) return;
    this.returnService.reviewReturn(this.reviewingItem.id, this.reviewAction, this.reviewNote).subscribe({
      next: () => {
        this.showToast(
          this.reviewAction === 'APPROVE'
            ? `Đã phê duyệt hoàn tiền đơn ${this.reviewingItem?.orderCode}`
            : `Đã từ chối khiếu nại đơn ${this.reviewingItem?.orderCode}`
        );
        this.closeModal();
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Lỗi khi xét duyệt khiếu nại'),
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3500);
  }
}
