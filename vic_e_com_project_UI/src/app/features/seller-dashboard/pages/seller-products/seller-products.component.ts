import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerCategoryOption } from '../../models/seller-dashboard.model';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import {
  SellerProduct,
  SellerProductService,
} from '../../services/seller-product.service';
import { ProductApiService } from '../../../../core/services/product-api.service';
import {
  SellerProductModalComponent,
  ProductSaveEvent,
} from '../../components/seller-product-modal/seller-product-modal.component';
import { SellerDeleteProductDialogComponent } from '../../components/seller-delete-product-dialog/seller-delete-product-dialog.component';
import {
  buildCategoryTreeOptions,
  formatVnd,
  getMinPrice,
  getMaxPrice,
  getTotalStock,
} from './seller-products.util';

@Component({
  selector: 'app-seller-products',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SellerProductModalComponent,
    SellerDeleteProductDialogComponent,
  ],
  templateUrl: './seller-products.component.html',
  styleUrl: './seller-products.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProductsComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly productService = inject(SellerProductService);
  private readonly productApiService = inject(ProductApiService);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly products = this.store.products;
  readonly allProductCount = this.store.allProductCount;
  readonly visibleProductCount = this.store.visibleProductCount;
  readonly hiddenProductCount = this.store.hiddenProductCount;
  readonly draftProductCount = this.store.draftProductCount;

  readonly productFilterStatus = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly dbCategories = signal<SellerCategoryOption[]>([]);

  readonly productModalOpen = signal<boolean>(false);
  readonly editingProduct = signal<SellerProduct | null>(null);

  readonly deleteConfirmOpen = signal<boolean>(false);
  readonly deleteProductTarget = signal<SellerProduct | null>(null);

  readonly formatVnd = formatVnd;
  readonly getMinPrice = getMinPrice;
  readonly getMaxPrice = getMaxPrice;
  readonly getTotalStock = getTotalStock;

  readonly filteredProducts = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const st = this.productFilterStatus();
    return this.products().filter((p) => {
      if (p.s === 'DELETED') return false;
      const matchStatus = st === 'ALL' || p.s === st;
      const matchSearch =
        !q ||
        p.n.toLowerCase().includes(q) ||
        (p.c && p.c.toLowerCase().includes(q)) ||
        (p.v && p.v.some((v) => v.sku.toLowerCase().includes(q)));
      return matchStatus && matchSearch;
    });
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  loadProducts(): void {
    this.productService.getProducts().subscribe({
      next: (list) => {
        this.products.set(list || []);
        this.cdr.markForCheck();
      },
      error: () => {
        this.products.set([]);
        this.cdr.markForCheck();
      },
    });
  }

  loadCategories(): void {
    this.productApiService.getCategories().subscribe({
      next: (items) => {
        if (items && items.length > 0) {
          this.dbCategories.set(buildCategoryTreeOptions(items));
        } else {
          this.dbCategories.set([]);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.dbCategories.set([]);
        this.cdr.markForCheck();
      },
    });
  }

  openCreateProductModal(): void {
    this.editingProduct.set(null);
    this.productModalOpen.set(true);
  }

  openEditProductModal(p: SellerProduct): void {
    this.editingProduct.set(p);
    this.productModalOpen.set(true);
  }

  closeProductModal(): void {
    this.productModalOpen.set(false);
  }

  handleSaveProduct(event: ProductSaveEvent): void {
    const editId = event.editId;
    const payload = event.payload;

    if (editId) {
      this.productService.updateProduct(editId, payload).subscribe({
        next: (updated: SellerProduct) => {
          this.products.update((list) =>
            list.map((prod) => (prod.id === editId ? updated : prod))
          );
          this.store.showToast('Cập nhật sản phẩm thành công');
          this.closeProductModal();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.store.showToast(err?.message || 'Lỗi khi cập nhật sản phẩm', true);
        },
      });
    } else {
      this.productService.createProduct(payload).subscribe({
        next: (created: SellerProduct) => {
          this.products.update((list) => [created, ...list]);
          this.store.showToast('Tạo sản phẩm thành công');
          this.closeProductModal();
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          this.store.showToast(err?.message || 'Lỗi khi tạo sản phẩm', true);
        },
      });
    }
  }

  confirmDeleteProduct(p: SellerProduct): void {
    this.deleteProductTarget.set(p);
    this.deleteConfirmOpen.set(true);
  }

  closeDeleteConfirm(): void {
    this.deleteConfirmOpen.set(false);
  }

  executeDeleteProduct(p: SellerProduct): void {
    this.productService.deleteProduct(p.id).subscribe({
      next: () => {
        this.products.update((list) => list.filter((item) => item.id !== p.id));
        this.closeDeleteConfirm();
        this.store.showToast('Đã xóa sản phẩm');
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.store.showToast(err?.message || 'Lỗi khi xóa sản phẩm', true);
      },
    });
  }

  toggleProductVisibility(p: SellerProduct): void {
    const targetStatus: 'VISIBLE' | 'HIDDEN' = p.s === 'VISIBLE' ? 'HIDDEN' : 'VISIBLE';
    this.productService.toggleProductStatus(p.id, targetStatus).subscribe({
      next: () => {
        this.products.update((list) =>
          list.map((item) => (item.id === p.id ? { ...item, s: targetStatus } : item))
        );
        this.store.showToast(
          targetStatus === 'VISIBLE'
            ? `▶️ Đã hiển thị lại sản phẩm "${p.n}" trên gian hàng khách.`
            : `⏸️ Đã ẩn sản phẩm "${p.n}" (khách hàng sẽ không thấy sản phẩm này).`
        );
        this.cdr.markForCheck();
      },
      error: () => {
        this.products.update((list) =>
          list.map((item) => (item.id === p.id ? { ...item, s: targetStatus } : item))
        );
        this.store.showToast(
          targetStatus === 'VISIBLE'
            ? `▶️ Đã hiển thị lại sản phẩm "${p.n}" trên gian hàng khách (cục bộ).`
            : `⏸️ Đã ẩn sản phẩm "${p.n}" (cục bộ).`
        );
        this.cdr.markForCheck();
      },
    });
  }
}
