import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerReturnRequest } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-returns',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './seller-returns.component.html',
  styleUrl: './seller-returns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerReturnsComponent {
  readonly returns = input.required<SellerReturnRequest[]>();

  readonly accept = output<number>();
  readonly reject = output<{ id: number; reason: string }>();

  readonly targetReturnForReject = signal<SellerReturnRequest | null>(null);
  readonly rejectReasonText = signal<string>('');
  readonly rejectError = signal<string | null>(null);

  openRejectModal(item: SellerReturnRequest): void {
    this.targetReturnForReject.set(item);
    this.rejectReasonText.set('');
    this.rejectError.set(null);
  }

  closeRejectModal(): void {
    this.targetReturnForReject.set(null);
  }

  confirmReject(): void {
    const text = this.rejectReasonText().trim();
    if (text.length < 5) {
      this.rejectError.set('Nhập lý do từ chối (tối thiểu 5 ký tự).');
      return;
    }
    const item = this.targetReturnForReject();
    if (item) {
      this.reject.emit({ id: item.id, reason: text });
    }
    this.closeRejectModal();
  }
}
