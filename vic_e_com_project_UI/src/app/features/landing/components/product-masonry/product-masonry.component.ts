import {
  Component, EventEmitter, Input, OnChanges, Output,
  computed, inject, signal,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { Product } from '../../../../core/models/product.model';
import { CategoryItem } from '../../../../core/models/category.model';
import { StoreConfigService } from '../../../../core/services/store-config.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-product-masonry',
  standalone: true,
  imports: [NgClass],
  templateUrl: './product-masonry.component.html',
  styleUrl: './product-masonry.component.scss',
})
export class ProductMasonryComponent implements OnChanges {
  private readonly storeConfig = inject(StoreConfigService);

  @Input({ required: true }) products: Product[] = [];
  @Input() activeCategory: CategoryItem | null = null;
  @Input() isLoading = false;

  @Output() resetCategory = new EventEmitter<void>();
  @Output() saveToggled = new EventEmitter<string>();

  readonly isSaleActive = computed(
    () => this.storeConfig.promotionConfig().isSaleCampaignActive,
  );
  readonly savedProductIds = signal<Set<string>>(new Set());
  readonly page = signal<number>(1);

  /** Slice của products hiện tại theo trang */
  readonly visibleProducts = computed(() =>
    this.products.slice(0, this.page() * PAGE_SIZE),
  );

  readonly hasMore = computed(
    () => this.visibleProducts().length < this.products.length,
  );

  ngOnChanges(): void {
    // Reset trang khi filter thay đổi
    this.page.set(1);
  }

  loadMore(): void {
    this.page.update(p => p + 1);
  }

  toggleSave(productId: string, event?: Event): void {
    event?.stopPropagation();
    const s = new Set(this.savedProductIds());
    s.has(productId) ? s.delete(productId) : s.add(productId);
    this.savedProductIds.set(s);
    this.saveToggled.emit(productId);
  }

  isSaved(productId: string): boolean {
    return this.savedProductIds().has(productId);
  }

  onResetCategory(): void { this.resetCategory.emit(); }

  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
