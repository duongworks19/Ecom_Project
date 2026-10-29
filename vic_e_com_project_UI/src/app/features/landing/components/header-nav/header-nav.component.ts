import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryItem, CategoryTreeNode } from '../../../../core/models/category.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UserMenuComponent } from '../../../../layouts/customer-layout/components/user-menu/user-menu.component';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { WishlistStateService } from '../../../wishlist/services/wishlist-state.service';
import { MiniCartComponent } from '../../../cart/components/mini-cart/mini-cart.component';

export interface SearchShopItem {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  pickupAddress?: string;
  ratingAvg?: number;
  productCount?: number;
}

export interface SearchProductItem {
  id: number;
  name: string;
  category?: string;
  description?: string;
  imageUrl?: string;
  price?: number;
  shopId?: number;
  shopName?: string;
  ratingAvg?: number;
  soldCount?: number;
}

@Component({
  selector: 'app-header-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserMenuComponent, MiniCartComponent, DecimalPipe],
  templateUrl: './header-nav.component.html',
  styleUrl: './header-nav.component.scss',
})
export class HeaderNavComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartState = inject(CartStateService);
  readonly wishlistState = inject(WishlistStateService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);

  @Input({ required: true }) categories: CategoryItem[] = [];
  @Input() activeCategoryId = 'all';

  @Output() categorySelected = new EventEmitter<string>();
  @Output() searchQueryChanged = new EventEmitter<string>();

  readonly searchQuery = signal<string>('');
  readonly isSearchFocused = signal<boolean>(false);
  readonly isCategoryMenuOpen = signal<boolean>(false);
  readonly isMiniCartOpen = signal<boolean>(false);

  // Live Search
  readonly isSearching = signal<boolean>(false);
  readonly searchResults = signal<{ shops: SearchShopItem[]; products: SearchProductItem[] }>({
    shops: [],
    products: [],
  });
  readonly isSearchDropdownOpen = signal<boolean>(false);
  private searchDebounceTimer?: any;

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.cartState.refreshCount();
      this.wishlistState.refreshIds();
    }
  }

  toggleMiniCart(): void {
    this.isMiniCartOpen.update((v) => !v);
  }

  closeMiniCart(): void {
    this.isMiniCartOpen.set(false);
  }

  hasHierarchy(): boolean {
    return Array.isArray(this.categories) && this.categories.some((c) => c.parentId !== null && c.parentId !== undefined);
  }

  treeColumns(): CategoryTreeNode[] {
    const list = this.categories || [];
    const parentMap = new Map<number | string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const item of list) {
      parentMap.set(item.id, { ...item, children: [] });
    }

    for (const item of list) {
      const node = parentMap.get(item.id)!;
      if (item.parentId && parentMap.has(item.parentId)) {
        parentMap.get(item.parentId)!.children.push(node);
      } else if (!item.parentId) {
        roots.push(node);
      }
    }
    return roots.length > 0 ? roots : list.map((i) => ({ ...i, children: [] }));
  }

  onSearchFocus(): void {
    this.isSearchFocused.set(true);
    const q = this.searchQuery().trim();
    if (q) {
      this.isSearchDropdownOpen.set(true);
      if (this.searchResults().shops.length === 0 && this.searchResults().products.length === 0) {
        this.executeLiveSearch(q);
      }
    }
  }

  onSearchInput(val: string): void {
    this.searchQuery.set(val);
    this.searchQueryChanged.emit(val);

    const query = val.trim();
    if (!query) {
      this.searchResults.set({ shops: [], products: [] });
      this.isSearchDropdownOpen.set(false);
      return;
    }

    clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => {
      this.executeLiveSearch(query);
    }, 200);
  }

  private executeLiveSearch(query: string): void {
    this.isSearching.set(true);
    this.http.get<any>(`http://localhost:9090/api/search?q=${encodeURIComponent(query)}&limit=6`).subscribe({
      next: (res) => {
        this.isSearching.set(false);
        const data = res?.data || { shops: [], products: [] };
        this.searchResults.set({
          shops: Array.isArray(data.shops) ? data.shops : [],
          products: Array.isArray(data.products) ? data.products : [],
        });
        this.isSearchDropdownOpen.set(true);
      },
      error: () => {
        this.isSearching.set(false);
        this.executeFallbackSearch(query);
      },
    });
  }

  private executeFallbackSearch(query: string): void {
    const qLower = query.toLowerCase();
    const shops: SearchShopItem[] = [];
    const products: SearchProductItem[] = [];

    const profRaw = localStorage.getItem('vic_seller_shop_profile');
    if (profRaw) {
      try {
        const p = JSON.parse(profRaw);
        if (p.n && p.n.toLowerCase().includes(qLower)) {
          shops.push({
            id: 1,
            name: p.n,
            description: p.d,
            ratingAvg: 5.0,
          });
        }
      } catch {}
    }

    const prodRaw = localStorage.getItem('vic_seller_products');
    if (prodRaw) {
      try {
        const list = JSON.parse(prodRaw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (item.n && item.n.toLowerCase().includes(qLower)) {
              const minPrice = item.v && item.v.length > 0 ? Math.min(...item.v.map((v: any) => v.p || 0)) : 0;
              products.push({
                id: item.id,
                name: item.n,
                category: item.c,
                price: minPrice,
                imageUrl: item.imageUrl,
                shopId: 1,
                shopName: 'Gian hàng của bạn',
              });
            }
          }
        }
      } catch {}
    }

    this.searchResults.set({ shops, products });
    this.isSearchDropdownOpen.set(shops.length > 0 || products.length > 0);
  }

  selectShop(shop: SearchShopItem): void {
    this.isSearchDropdownOpen.set(false);
    this.router.navigate(['/shop', shop.id]);
  }

  selectProduct(product: SearchProductItem): void {
    this.isSearchDropdownOpen.set(false);
    this.router.navigate(['/product', product.id]);
  }

  onSearchSubmit(): void {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return;

    const res = this.searchResults();
    // 1. Khớp gian hàng
    const exactShop = res.shops.find((s) => s.name.toLowerCase() === q || s.name.toLowerCase().startsWith(q));
    if (exactShop) {
      this.selectShop(exactShop);
      return;
    }

    // 2. Khớp sản phẩm
    const exactProd = res.products.find((p) => p.name.toLowerCase() === q);
    if (exactProd) {
      this.selectProduct(exactProd);
      return;
    }

    // 3. Nếu chỉ có shop kết quả duy nhất
    if (res.shops.length > 0 && res.products.length === 0) {
      this.selectShop(res.shops[0]);
      return;
    }

    // 4. Nếu chỉ có sản phẩm kết quả duy nhất
    if (res.products.length === 1 && res.shops.length === 0) {
      this.selectProduct(res.products[0]);
      return;
    }

    // 5. Nếu đang ở trang khác, về trang chủ kèm query
    this.isSearchDropdownOpen.set(false);
    if (this.router.url !== '/' && !this.router.url.startsWith('/?')) {
      this.router.navigate(['/'], { queryParams: { q } });
    } else {
      this.searchQueryChanged.emit(q);
      const el = document.getElementById('discovery-grid');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchResults.set({ shops: [], products: [] });
    this.isSearchDropdownOpen.set(false);
    this.searchQueryChanged.emit('');
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (this.isSearchDropdownOpen() && target && !target.closest('.search-bar-wrap')) {
      this.isSearchDropdownOpen.set(false);
    }
  }

  toggleCategoryMenu() {
    this.isCategoryMenuOpen.update((v) => !v);
  }

  selectCategory(slugOrId: string | number) {
    this.categorySelected.emit(String(slugOrId));
    this.isCategoryMenuOpen.set(false);
  }
}
