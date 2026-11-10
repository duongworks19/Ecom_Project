import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerReturnsApiService } from '../../services/seller-returns-api.service';

@Component({
  selector: 'app-seller-returns',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-returns.component.html',
  styleUrl: './seller-returns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerReturnsComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly returnsApi = inject(SellerReturnsApiService);

  readonly returns = this.store.returns;

  ngOnInit(): void {
    this.returnsApi.getReturns().subscribe({
      next: (res) => {
        const list = res?.data || res || [];
        if (Array.isArray(list)) {
          this.store.setReturns(list);
        }
      },
      error: () => {},
    });
  }

  formatVnd(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + 'đ';
  }

  approveReturn(id: number): void {
    this.returns.update((list) =>
      list.map((r) => (r.id === id ? { ...r, st: 'APPROVED' as const, re: 'Đã nhận lại hàng và hoàn tiền' } : r))
    );
    this.returnsApi.approveReturn(id).subscribe({ next: () => {}, error: () => {} });
    this.store.showToast('Đã chấp nhận đổi trả / hoàn tiền. Kho hàng đã được cộng lại.');
  }

  rejectReturn(id: number): void {
    const r = this.returns().find((item) => item.id === id);
    if (!r) return;
    this.returns.update((list) =>
      list.map((item) => (item.id === id ? { ...item, st: 'REJECTED' as const } : item))
    );
    this.returnsApi.rejectReturn(id).subscribe({ next: () => {}, error: () => {} });
    this.store.showToast(`Từ chối yêu cầu đổi trả ${r.o}`);
  }
}
