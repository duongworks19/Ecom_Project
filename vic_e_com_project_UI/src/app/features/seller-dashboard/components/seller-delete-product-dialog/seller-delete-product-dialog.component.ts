import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerProduct } from '../../services/seller-product.service';

@Component({
  selector: 'app-seller-delete-product-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-delete-product-dialog.component.html',
  styleUrl: './seller-delete-product-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerDeleteProductDialogComponent {
  @Input() isOpen = false;
  @Input() product: SellerProduct | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<SellerProduct>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  onConfirm(): void {
    if (this.product) {
      this.confirm.emit(this.product);
    }
  }
}
