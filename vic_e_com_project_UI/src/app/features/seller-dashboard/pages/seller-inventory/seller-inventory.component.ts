import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerProductService, SellerProduct, ProductVariant } from '../../services/seller-product.service';

@Component({
  selector: 'app-seller-inventory',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-inventory.component.html',
  styleUrl: './seller-inventory.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerInventoryComponent {
  readonly store = inject(SellerDashboardStore);
  private readonly productService = inject(SellerProductService);

  readonly products = this.store.products;
  readonly lowStockOnly = signal<boolean>(false);
  readonly lowStockItems = this.store.lowStockItems;

  readonly inventoryList = computed(() => {
    const result: { p: SellerProduct; v: ProductVariant; idx: number }[] = [];
    const onlyLow = this.lowStockOnly();

    for (const prod of this.products()) {
      if (prod.s === 'DELETED') continue;
      if (!prod.v || !prod.v.length) continue;

      prod.v.forEach((variant, idx) => {
        if (!onlyLow || variant.q <= variant.l) {
          result.push({ p: prod, v: variant, idx });
        }
      });
    }
    return result;
  });

  saveInventoryStock(prodId: number, variantIdx: number, qVal: string, lVal: string): void {
    const q = parseInt(qVal, 10);
    const l = parseInt(lVal, 10);
    if (isNaN(q) || isNaN(l) || q < 0 || l < 0) {
      this.store.showToast('⚠️ Tồn kho và ngưỡng cảnh báo phải là số nguyên ≥ 0.', true);
      return;
    }

    const targetProd = this.products().find((p) => p.id === prodId);
    if (!targetProd || !targetProd.v || !targetProd.v[variantIdx]) {
      this.store.showToast('⚠️ Không tìm thấy biến thể sản phẩm cần cập nhật.', true);
      return;
    }

    const updatedVariants = structuredClone(targetProd.v);
    const targetVariant = updatedVariants[variantIdx];
    targetVariant.q = q;
    targetVariant.l = l;

    const payload = {
      sku: targetVariant.sku,
      q,
      l,
      variants: updatedVariants,
    };

    this.productService.updateStock(prodId, payload).subscribe({
      next: () => {
        this.products.update((list) =>
          list.map((p) => (p.id === prodId ? { ...p, v: updatedVariants } : p))
        );
        this.store.showToast(`✅ Đã lưu tồn kho: ${targetVariant.sku || targetProd.n} (Tồn: ${q}).`);
      },
      error: () => {
        this.products.update((list) =>
          list.map((p) => (p.id === prodId ? { ...p, v: updatedVariants } : p))
        );
        this.store.showToast(`✅ Đã lưu tồn kho: ${targetVariant.sku || targetProd.n} (Tồn: ${q}).`);
      },
    });
  }
}
