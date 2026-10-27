import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CategoryItem } from '../../../../core/models/category.model';
import { ProductService } from '../../../../core/services/product.service';

@Component({
  selector: 'app-product-filter-bar',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

      this.productService.setFilters({
        category,
        priceRange: price,
        rating,
        sort,
      });
    });
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
      queryParams: {
        category: null,
        price: null,
        rating: null,
        sort: null,
      },
      queryParamsHandling: 'merge',
    }).then(() => {
      this.productService.resetAllFilters();
    });
  }
}
