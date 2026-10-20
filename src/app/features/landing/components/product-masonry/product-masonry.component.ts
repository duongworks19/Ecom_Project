import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../../core/models/product.model';
import { CategoryItem } from '../../../../core/models/category.model';
import { StoreConfigService } from '../../../../core/services/store-config.service';

@Component({
  selector: 'app-product-masonry',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-masonry.component.html',
  styleUrl: './product-masonry.component.scss',
})
export class ProductMasonryComponent {
  private readonly storeConfig = inject(StoreConfigService);

  @Input({ required: true }) products: Product[] = [];
  @Input() activeCategory: CategoryItem | null = null;
  @Input() isLoading = false;

  @Output() resetCategory = new EventEmitter<void>();
  @Output() saveToggled = new EventEmitter<string>();

  readonly isSaleActive = computed(
    () => this.storeConfig.promotionConfig().isSaleCampaignActive
  );

  readonly savedProductIds = signal<Set<string>>(new Set());

  toggleSave(productId: string, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const current = new Set(this.savedProductIds());
    if (current.has(productId)) {
      current.delete(productId);
    } else {
      current.add(productId);
    }
    this.savedProductIds.set(current);
    this.saveToggled.emit(productId);
  }

  isSaved(productId: string): boolean {
    return this.savedProductIds().has(productId);
  }

  onResetCategory() {
    this.resetCategory.emit();
  }

  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }
}
