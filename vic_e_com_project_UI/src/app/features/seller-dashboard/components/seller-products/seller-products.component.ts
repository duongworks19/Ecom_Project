import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerProduct } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProductsComponent {
  readonly products = input.required<SellerProduct[]>();

  readonly openAddProduct = output<void>();
  readonly editProduct = output<SellerProduct>();
  readonly deleteProduct = output<number>();
  readonly toggleVisibility = output<number>();

  readonly statusFilter = signal<'ALL' | 'ACTIVE' | 'HIDDEN' | 'LOW_STOCK'>('ALL');
  readonly searchQuery = signal<string>('');

  // Modals
  readonly targetProductForDelete = signal<SellerProduct | null>(null);
  readonly showImportExportModal = signal<boolean>(false);
  readonly importError = signal<string | null>(null);

  readonly filteredProducts = computed(() => {
    const list = this.products();
    const st = this.statusFilter();
    const q = this.searchQuery().trim().toLowerCase();

    return list.filter((p) => {
      const matchSt =
        st === 'ALL'
          ? true
          : st === 'ACTIVE'
          ? p.status === 'ACTIVE'
          : st === 'HIDDEN'
          ? p.status === 'HIDDEN'
          : p.stock <= 10;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      return matchSt && matchQuery;
    });
  });

  getCount(type: 'ALL' | 'ACTIVE' | 'HIDDEN' | 'LOW_STOCK'): number {
    const list = this.products();
    if (type === 'ALL') return list.length;
    if (type === 'ACTIVE') return list.filter((p) => p.status === 'ACTIVE').length;
    if (type === 'HIDDEN') return list.filter((p) => p.status === 'HIDDEN').length;
    return list.filter((p) => p.stock <= 10).length;
  }

  onOpenDelete(prod: SellerProduct): void {
    this.targetProductForDelete.set(prod);
  }

  confirmDelete(): void {
    const prod = this.targetProductForDelete();
    if (prod) {
      this.deleteProduct.emit(prod.id);
    }
    this.targetProductForDelete.set(null);
  }

  closeDeleteModal(): void {
    this.targetProductForDelete.set(null);
  }

  openImportExport(): void {
    this.importError.set(null);
    this.showImportExportModal.set(true);
  }

  closeImportExport(): void {
    this.showImportExportModal.set(false);
  }

  onFileImport(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/\.(csv|xlsx)$/i.test(file.name) || file.size > 5 * 1024 * 1024) {
      this.importError.set('Chỉ nhận file .csv hoặc .xlsx tối đa 5MB.');
      return;
    }

    this.importError.set(null);
  }
}
