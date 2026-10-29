import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Product } from '../models/product.model';
import { CategoryItem } from '../models/category.model';
import { ProductApiService } from './product-api.service';
import { INITIAL_PRODUCTS } from '../../features/landing/constants/landing-products.mock';

export interface ProductFilterState {
  category: string;
  priceRange: string;
  rating: string;
  sort: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private readonly productApi = inject(ProductApiService);
  private readonly http = inject(HttpClient);

  readonly categories = signal<CategoryItem[]>([]);
  readonly allProducts = signal<Product[]>(INITIAL_PRODUCTS);
  readonly activeCategoryId = signal<string>('all');
  readonly searchQuery = signal<string>('');
  readonly selectedPriceRange = signal<string>('all');
  readonly selectedRating = signal<string>('all');
  readonly selectedSort = signal<string>('default');
  readonly isLoading = signal<boolean>(false);

  readonly currentCategory = computed(() => {
    const idOrSlug = this.activeCategoryId();
    if (idOrSlug === 'all') return null;
    return this.categories().find(
      (c) => String(c.id) === idOrSlug || c.slug === idOrSlug,
    ) || null;
  });

  readonly filteredProducts = computed(() => {
    let list = [...this.allProducts()];
    const cat = this.activeCategoryId();
    const query = this.searchQuery().trim().toLowerCase();
    const price = this.selectedPriceRange();
    const minRating = this.selectedRating();
    const sort = this.selectedSort();

    if (cat !== 'all') {
      const targetCat = this.categories().find(
        (c) => String(c.id) === cat || c.slug === cat,
      );
      const slug = targetCat ? targetCat.slug.toLowerCase() : cat.toLowerCase();
      list = list.filter((p) =>
        p.category.toLowerCase().includes(slug) ||
        p.categoryLabel.toLowerCase().includes(slug) ||
        (targetCat && p.categoryLabel.toLowerCase().includes(targetCat.name.toLowerCase())),
      );
    }

    if (query) {
      list = list.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.categoryLabel.toLowerCase().includes(query) ||
        p.seller.name.toLowerCase().includes(query),
      );
    }

    if (price === 'under-500k') list = list.filter((p) => p.price < 500000);
    else if (price === '500k-2m') list = list.filter((p) => p.price >= 500000 && p.price <= 2000000);
    else if (price === '2m-5m') list = list.filter((p) => p.price >= 2000000 && p.price <= 5000000);
    else if (price === 'above-5m') list = list.filter((p) => p.price > 5000000);

    if (minRating === '4') list = list.filter((p) => p.rating >= 4.0);
    else if (minRating === '4.5') list = list.filter((p) => p.rating >= 4.5);
    else if (minRating === '5') list = list.filter((p) => p.rating >= 5.0);

    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating-desc') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'popular') list.sort((a, b) => b.soldCount - a.soldCount);

    return list;
  });

  constructor() {
    this.fetchDataFromApi();
  }

  fetchDataFromApi() {
    this.isLoading.set(true);
    this.productApi.getCategories().subscribe({
      next: (apiCategories) => {
        if (apiCategories && apiCategories.length > 0) {
          this.categories.set(apiCategories);
        }
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });

    this.http.get<any>('http://localhost:9090/api/products').subscribe({
      next: (res) => {
        const dbProducts = res?.data || res;
        if (Array.isArray(dbProducts) && dbProducts.length > 0) {
          const mapped: Product[] = dbProducts.map((p: any) => ({
            id: String(p.id),
            name: p.name,
            category: 'fashion',
            categoryLabel: p.category || 'Thời trang & Phụ kiện',
            price: Number(p.price) || 0,
            soldCount: p.soldCount || 0,
            rating: p.ratingAvg ? Number(p.ratingAvg) : 5.0,
            image: p.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
            aspectRatio: 'square',
            seller: {
              name: p.shopName || 'VICMART Shop',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80',
              verified: true,
            },
            shopId: p.shopId || 1,
          }));
          this.allProducts.set([...mapped, ...INITIAL_PRODUCTS]);
        }
      },
      error: () => {},
    });
  }

  setCategory(categoryIdOrSlug: string, autoScroll = true) {
    this.activeCategoryId.set(categoryIdOrSlug);
    if (autoScroll) this.scrollToDiscoveryGrid();
  }

  setFilters(criteria: Partial<ProductFilterState>, autoScroll = false) {
    if (criteria.category !== undefined) this.activeCategoryId.set(criteria.category);
    if (criteria.priceRange !== undefined) this.selectedPriceRange.set(criteria.priceRange);
    if (criteria.rating !== undefined) this.selectedRating.set(criteria.rating);
    if (criteria.sort !== undefined) this.selectedSort.set(criteria.sort);
    if (autoScroll) this.scrollToDiscoveryGrid();
  }

  resetAllFilters() {
    this.activeCategoryId.set('all');
    this.selectedPriceRange.set('all');
    this.selectedRating.set('all');
    this.selectedSort.set('default');
    this.searchQuery.set('');
  }

  setSearchQuery(query: string) {
    this.searchQuery.set(query);
  }

  scrollToDiscoveryGrid() {
    setTimeout(() => {
      const el = document.getElementById('discovery-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }
}
