import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerVoucher } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-vouchers',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './seller-vouchers.component.html',
  styleUrl: './seller-vouchers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerVouchersComponent {
  readonly vouchers = input.required<SellerVoucher[]>();

  readonly createVoucher = output<{
    code: string;
    title: string;
    discountText: string;
    minOrderAmount: number;
    totalQuota: number;
    expiryDate: string;
  }>();
  readonly toggleVoucher = output<number>();
  readonly deleteVoucher = output<string>();

  readonly showModal = signal<boolean>(false);
  readonly editingVoucher = signal<SellerVoucher | null>(null);
  readonly modalError = signal<string | null>(null);

  form = {
    code: '',
    title: 'Giảm giá mua sắm',
    discountType: 'PERCENT',
    val: 10,
    minOrder: 200000,
    quota: 100,
    expiryDate: '31/12/2026',
  };

  openCreate(): void {
    this.editingVoucher.set(null);
    this.modalError.set(null);
    this.form = {
      code: `VIC${Math.floor(10 + Math.random() * 90)}K`,
      title: 'Giảm giá mua sắm',
      discountType: 'FIXED',
      val: 30000,
      minOrder: 250000,
      quota: 50,
      expiryDate: '31/12/2026',
    };
    this.showModal.set(true);
  }

  openEdit(v: SellerVoucher): void {
    this.editingVoucher.set(v);
    this.modalError.set(null);
    this.form = {
      code: v.code,
      title: v.title || 'Giảm giá mua sắm',
      discountType: (v.discountText || '').includes('%') ? 'PERCENT' : (v.discountType || 'FIXED'),
      val: v.value != null ? Number(v.value) : 20000,
      minOrder: v.minOrderAmount || 0,
      quota: v.totalQuota || v.usageLimit || 100,
      expiryDate: v.expiryDate || (v.endAt ? v.endAt.split('T')[0] : '31/12/2026'),
    };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  saveVoucher(): void {
    const code = this.form.code.trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      this.modalError.set('Mã voucher gồm 3–20 ký tự chữ hoa hoặc số.');
      return;
    }
    if (!this.form.val || this.form.val <= 0) {
      this.modalError.set('Giá trị giảm phải lớn hơn 0.');
      return;
    }

    const discountText =
      this.form.discountType === 'PERCENT'
        ? `Giảm ${this.form.val}%`
        : `Giảm ${this.form.val.toLocaleString('vi-VN')}₫`;

    this.createVoucher.emit({
      code,
      title: this.form.title,
      discountText,
      minOrderAmount: this.form.minOrder,
      totalQuota: this.form.quota,
      expiryDate: this.form.expiryDate,
    });
    this.showModal.set(false);
  }
}
