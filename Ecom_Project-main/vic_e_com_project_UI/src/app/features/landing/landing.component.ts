import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductService } from '../../core/services/product.service';
import { HeaderNavComponent } from './components/header-nav/header-nav.component';
import { HeroBannerComponent } from './components/hero-banner/hero-banner.component';
import { ValuePropsComponent } from './components/value-props/value-props.component';
import { FlashSaleComponent } from './components/flash-sale/flash-sale.component';
import { ProductMasonryComponent } from './components/product-masonry/product-masonry.component';
import { EditorialMagazineComponent } from './components/editorial-magazine/editorial-magazine.component';
import { CtaBannerComponent } from './components/cta-banner/cta-banner.component';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    CommonModule,
    HeaderNavComponent,
    HeroBannerComponent,
    ValuePropsComponent,
    FlashSaleComponent,
    ProductMasonryComponent,
    EditorialMagazineComponent,
    CtaBannerComponent,
    FooterComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
})
export class LandingComponent {
  private readonly productService = inject(ProductService);

  // Expose signals to template
  readonly categories = this.productService.categories;
  readonly activeCategoryId = this.productService.activeCategoryId;
  readonly currentCategory = this.productService.currentCategory;
  readonly filteredProducts = this.productService.filteredProducts;
  readonly isLoading = this.productService.isLoading;

  readonly toastMessage = signal<string | null>(null);

  /**
   * Chọn danh mục và tự động cuộn mượt xuống lưới sản phẩm
   */
  onCategorySelected(categoryId: string) {
    this.productService.setCategory(categoryId, true);
  }

  onResetCategory() {
    this.productService.setCategory('all', true);
  }

  onSearchQueryChanged(query: string) {
    this.productService.setSearchQuery(query);
  }

  onSaveToggled(productId: string) {
    this.showToast('❤️ Đã cập nhật trạng thái lưu ghim sản phẩm!');
  }

  showToast(msg: string) {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3200);
  }
}
