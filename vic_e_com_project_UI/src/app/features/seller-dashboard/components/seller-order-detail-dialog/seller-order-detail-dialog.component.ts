import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderItem } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-order-detail-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-order-detail-dialog.component.html',
  styleUrl: './seller-order-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerOrderDetailDialogComponent {
  @Input() isOpen = false;
  @Input() order: OrderItem | null = null;

  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  formatVnd(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + 'đ';
  }
}
