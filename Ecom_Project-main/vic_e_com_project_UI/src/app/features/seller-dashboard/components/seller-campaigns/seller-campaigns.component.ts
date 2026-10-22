import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SellerProduct,
  SellerPromotion,
} from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-campaigns.component.html',
  styleUrl: './seller-campaigns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerCampaignsComponent {
  readonly promotions = input.required<SellerPromotion[]>();
  readonly products = input.required<SellerProduct[]>();

  readonly showModal = signal<boolean>(false);
  readonly modalError = signal<string | null>(null);

  form = {
    name: '',
    type: 'Flash sale',
    discountType: '%',
    discountPercent: 15,
    startDate: '2026-10-22',
    endDate: '2026-10-25',
    quota: 50,
  };

  selectedProductIds = signal<number[]>([]);

  openCreate(): void {
    this.modalError.set(null);
    this.form = {
      name: '',
      type: 'Flash sale',
      discountType: '%',
      discountPercent: 15,
      startDate: '2026-10-22',
      endDate: '2026-10-25',
      quota: 50,
    };
    this.selectedProductIds.set(this.products().slice(0, 2).map((p) => p.id));
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  toggleProductSelection(id: number): void {
    this.selectedProductIds.update((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]
    );
  }

  saveCampaign(): void {
    const name = this.form.name.trim();
    if (name.length < 3) {
      this.modalError.set('Nhập tên chương trình (từ 3 ký tự).');
      return;
    }
    if (!this.form.endDate || this.form.endDate < this.form.startDate) {
      this.modalError.set('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }
    if (this.selectedProductIds().length === 0) {
      this.modalError.set('Chọn ít nhất một sản phẩm áp dụng.');
      return;
    }

    this.showModal.set(false);
  }
}
