import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LowStockProduct } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-low-stock-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './low-stock-panel.component.html',
  styleUrl: './low-stock-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LowStockPanelComponent {
  readonly products = input.required<LowStockProduct[]>();

  readonly updateStockNavigate = output<void>();
  readonly quickRestock = output<LowStockProduct>();

  readonly failedImages = signal<Record<number, boolean>>({});

  onImageError(productId: number): void {
    this.failedImages.update((prev) => ({ ...prev, [productId]: true }));
  }

  onUpdateStockClick(event: Event): void {
    event.preventDefault();
    this.updateStockNavigate.emit();
  }

  onRestockProduct(product: LowStockProduct, event: Event): void {
    event.stopPropagation();
    this.quickRestock.emit(product);
  }
}
