import { Component, inject, signal } from '@angular/core';
import { ProductService } from '../../core/services/product.service';
import { HeaderNavComponent } from './components/header-nav/header-nav.component';
import { HeroBannerComponent } from './components/hero-banner/hero-banner.component';
import { ProductFilterBarComponent } from './components/product-filter-bar/product-filter-bar.component';
import { FlashSaleComponent } from './components/flash-sale/flash-sale.component';
import { ProductMasonryComponent } from './components/product-masonry/product-masonry.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeaderNavComponent,
    HeroBannerComponent,
    ProductFilterBarComponent,
    FlashSaleComponent,
    ProductMasonryComponent,
    FooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly productService = inject(ProductService);

  readonly categories = this.productService.categories;
  readonly activeCategoryId = this.productService.activeCategoryId;
  readonly currentCategory = this.productService.currentCategory;
  readonly filteredProducts = this.productService.filteredProducts;
  readonly isLoading = this.productService.isLoading;

  readonly toastMessage = signal<string | null>(null);

  onCategorySelected(categoryId: string): void {
    this.productService.setCategory(categoryId, true);
  }

  onResetCategory(): void {
    this.productService.setCategory('all', true);
  }

  onSearchQueryChanged(query: string): void {
    this.productService.setSearchQuery(query);
  }

  onSaveToggled(_productId: string): void {
    this.showToast('❤️ Đã cập nhật danh sách yêu thích!');
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3200);
  }
}
