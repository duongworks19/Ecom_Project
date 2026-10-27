import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryItem } from '../../../../core/models/category.model';
import { ProductService } from '../../../../core/services/product.service';
import { CategoryTreeSelectComponent } from './components/category-tree-select/category-tree-select.component';
import { CustomSelectComponent, SelectOption } from './components/custom-select/custom-select.component';

@Component({
  selector: 'app-product-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, CategoryTreeSelectComponent, CustomSelectComponent],
  templateUrl: './product-filter-bar.component.html',
  styleUrl: './product-filter-bar.component.scss',
})
export class ProductFilterBarComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);

  @Input({ required: true }) categories: CategoryItem[] = [];

  readonly selectedCategory = signal<string>('all');
  readonly selectedPriceRange = signal<string>('all');
  readonly selectedRating = signal<string>('all');
  readonly selectedSort = signal<string>('default');

  readonly priceOptions: SelectOption[] = [
    { label: 'Tất cả mức giá', value: 'all' },
    { label: 'Dưới 500.000₫', value: 'under-500k' },
    { label: '500.000₫ – 2.000.000₫', value: '500k-2m' },
    { label: '2.000.000₫ – 5.000.000₫', value: '2m-5m' },
    { label: 'Trên 5.000.000₫', value: 'above-5m' },
  ];

  readonly ratingOptions: SelectOption[] = [
    { label: 'Tất cả đánh giá', value: 'all' },
    { label: 'Từ 4.0 sao trở lên', value: '4', icon: '⭐' },
    { label: 'Từ 4.5 sao trở lên', value: '4.5', icon: '⭐' },
    { label: '5.0 sao tuyệt đối', value: '5', icon: '⭐' },
  ];

  readonly sortOptions: SelectOption[] = [
    { label: 'Sắp xếp: Mặc định', value: 'default' },
    { label: 'Bán chạy nhất', value: 'popular' },
    { label: 'Giá: Thấp đến Cao', value: 'price-asc' },
    { label: 'Giá: Cao đến Thấp', value: 'price-desc' },
    { label: 'Đánh giá cao nhất', value: 'rating-desc' },
  ];

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      const category = params['category'] || 'all';
      const price = params['price'] || 'all';
      const rating = params['rating'] || 'all';
      const sort = params['sort'] || 'default';

      this.selectedCategory.set(category);
      this.selectedPriceRange.set(price);
      this.selectedRating.set(rating);
      this.selectedSort.set(sort);

      this.productService.setFilters({ category, priceRange: price, rating, sort });
    });
  }

  onCategorySelected(slug: string): void {
    this.selectedCategory.set(slug);
  }

  onPriceChange(val: string): void {
    this.selectedPriceRange.set(val);
  }

  onRatingChange(val: string): void {
    this.selectedRating.set(val);
  }

  onSortChange(val: string): void {
    this.selectedSort.set(val);
  }

  onApplyFilter(): void {
    const cat = this.selectedCategory();
    const price = this.selectedPriceRange();
    const rating = this.selectedRating();
    const sort = this.selectedSort();

    const queryParams: Record<string, string | null> = {
      category: cat !== 'all' ? cat : null,
      price: price !== 'all' ? price : null,
      rating: rating !== 'all' ? rating : null,
      sort: sort !== 'default' ? sort : null,
    };

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
    }).then(() => {
      this.productService.scrollToDiscoveryGrid();
    });
  }

  onClearFilter(): void {
    this.selectedCategory.set('all');
    this.selectedPriceRange.set('all');
    this.selectedRating.set('all');
    this.selectedSort.set('default');

    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, price: null, rating: null, sort: null },
      queryParamsHandling: 'merge',
    }).then(() => {
      this.productService.resetAllFilters();
    });
  }
}
