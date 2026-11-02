import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface SellerVoucherFormData {
  code: string;
  t: 'PERCENT' | 'FIXED';
  val: number;
  max: number;
  min: number;
  lim: number;
  from: string;
  to: string;
}

@Component({
  selector: 'app-seller-voucher-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-voucher-modal.component.html',
  styleUrl: './seller-voucher-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerVoucherModalComponent implements OnChanges {
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<SellerVoucherFormData>();

  readonly formVoucher = signal<SellerVoucherFormData>(this.createInitialForm());
  readonly error = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']?.currentValue) {
      this.formVoucher.set(this.createInitialForm());
      this.error.set('');
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  private createInitialForm(): SellerVoucherFormData {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    return {
      code: '',
      t: 'PERCENT',
      val: 10,
      max: 50000,
      min: 100000,
      lim: 200,
      from: today.toISOString().split('T')[0],
      to: nextMonth.toISOString().split('T')[0],
    };
  }

  submit(): void {
    const v = this.formVoucher();
    const code = (v.code || '').trim().toUpperCase();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      this.error.set('Mã voucher gồm 3–20 ký tự chữ hoa hoặc số.');
      return;
    }
    if (v.val == null || v.val <= 0 || (v.t === 'PERCENT' && v.val > 100)) {
      this.error.set('Giá trị giảm không hợp lệ.');
      return;
    }
    if (!v.to || v.to < (v.from || '')) {
      this.error.set('Ngày kết thúc phải sau ngày bắt đầu.');
      return;
    }

    this.save.emit({ ...v, code });
  }
}
