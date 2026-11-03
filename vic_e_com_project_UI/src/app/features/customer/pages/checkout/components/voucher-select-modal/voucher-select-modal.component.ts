import { Component, input, output, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VndCurrencyPipe } from '../../../../../../shared/pipes/vnd-currency.pipe';
import { CheckoutAvailableVoucher } from '../../models/checkout.models';

@Component({
  selector: 'vic-voucher-select-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe],
  templateUrl: './voucher-select-modal.component.html',
  styleUrl: './voucher-select-modal.component.scss',
})
export class VoucherSelectModalComponent {
  readonly isOpen = input<boolean>(false);
  readonly shopId = input<number | null>(null);
  readonly shopName = input<string>('');
  readonly subtotal = input<number>(0);
  readonly selectedCode = input<string | null>(null);
  readonly vouchers = input<CheckoutAvailableVoucher[]>([]);
  readonly errorMessage = input<string | null>(null);

  readonly applyCode = output<string>();
  readonly removeCode = output<void>();
  readonly closeModal = output<void>();

  readonly manualCode = signal<string>('');

  readonly shopVouchers = computed(() => {
    const list = this.vouchers();
    const curShopId = this.shopId();
    return list.filter((v) => {
      if (v.scope === 'SHOP') return true;
      if (v.shopId != null && curShopId != null) {
        return String(v.shopId) === String(curShopId);
      }
      return false;
    });
  });

  readonly webVouchers = computed(() => {
    const list = this.vouchers();
    return list.filter((v) => v.scope === 'WEB' || v.shopId == null || !v.shopId);
  });

  onClose(): void {
    this.closeModal.emit();
  }

  onSelectVoucher(voucher: CheckoutAvailableVoucher): void {
    if (!this.isEligible(voucher)) return;
    this.applyCode.emit(voucher.code);
  }

  onManualApply(): void {
    const code = this.manualCode().trim();
    if (!code) return;
    this.applyCode.emit(code);
    this.manualCode.set('');
  }

  onRemove(): void {
    this.removeCode.emit();
  }

  isEligible(voucher: CheckoutAvailableVoucher): boolean {
    const sub = this.subtotal();
    return sub >= (voucher.minOrderAmount || 0);
  }

  remainingForEligibility(voucher: CheckoutAvailableVoucher): number {
    const sub = this.subtotal();
    return Math.max(0, (voucher.minOrderAmount || 0) - sub);
  }

  isSelected(code: string): boolean {
    const selected = this.selectedCode();
    if (!selected || !code) return false;
    return selected.trim().toUpperCase() === code.trim().toUpperCase();
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }
}
