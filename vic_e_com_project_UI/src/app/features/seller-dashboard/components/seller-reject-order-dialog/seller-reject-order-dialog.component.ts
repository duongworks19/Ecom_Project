import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-seller-reject-order-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-reject-order-dialog.component.html',
  styleUrl: './seller-reject-order-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerRejectOrderDialogComponent {
  @Input() isOpen = false;
  @Input() orderCode = '';

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ code: string; reason: string }>();

  readonly reason = signal<string>('');
  readonly error = signal<string>('');

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  setReason(r: string): void {
    this.reason.set(r);
    this.error.set('');
  }

  submit(): void {
    const r = this.reason().trim();
    if (r.length < 5) {
      this.error.set('Nhập lý do từ chối (tối thiểu 5 ký tự).');
      return;
    }
    this.confirm.emit({ code: this.orderCode, reason: r });
    this.reason.set('');
    this.error.set('');
  }
}
