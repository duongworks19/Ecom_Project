import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerProduct } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-inventory.component.html',
  styleUrl: './seller-inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerInventoryComponent {
  readonly products = input.required<SellerProduct[]>();
  readonly updateStock = output<{ productId: number; stock: number; threshold: number }>();

  readonly filterLow = signal<boolean>(false);

  // Local draft inputs for stock and threshold per product
  stockDrafts: Record<number, number> = {};
  thresholdDrafts: Record<number, number> = {};

  readonly displayedProducts = computed(() => {
    const list = this.products();
    if (this.filterLow()) {
      return list.filter((p) => p.stock <= (this.thresholdDrafts[p.id] || 10));
    }
    return list;
  });

  readonly lowStockCount = computed(
    () => this.products().filter((p) => p.stock <= 10).length
  );

  getStock(productId: number, fallback: number): number {
    return this.stockDrafts[productId] !== undefined ? this.stockDrafts[productId] : fallback;
  }

  getThreshold(productId: number): number {
    return this.thresholdDrafts[productId] !== undefined ? this.thresholdDrafts[productId] : 5;
  }

  setStock(productId: number, val: number): void {
    this.stockDrafts[productId] = Number(val) || 0;
  }

  setThreshold(productId: number, val: number): void {
    this.thresholdDrafts[productId] = Number(val) || 0;
  }

  onSave(p: SellerProduct): void {
    const stock = this.getStock(p.id, p.stock);
    const threshold = this.getThreshold(p.id);
    this.updateStock.emit({ productId: p.id, stock, threshold });
  }
}
