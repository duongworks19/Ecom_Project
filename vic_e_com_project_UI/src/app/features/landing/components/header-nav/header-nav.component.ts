import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryItem, CategoryTreeNode } from '../../../../core/models/category.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UserMenuComponent } from '../../../../layouts/customer-layout/components/user-menu/user-menu.component';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { WishlistStateService } from '../../../wishlist/services/wishlist-state.service';
import { MiniCartComponent } from '../../../cart/components/mini-cart/mini-cart.component';

@Component({
  selector: 'app-header-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserMenuComponent, MiniCartComponent],
  templateUrl: './header-nav.component.html',
  styleUrl: './header-nav.component.scss',
})
export class HeaderNavComponent implements OnInit {
  readonly authService = inject(AuthService);
  readonly cartState = inject(CartStateService);
  readonly wishlistState = inject(WishlistStateService);
  private readonly router = inject(Router);

  @Input({ required: true }) categories: CategoryItem[] = [];
  @Input() activeCategoryId = 'all';

  @Output() categorySelected = new EventEmitter<string>();
  @Output() searchQueryChanged = new EventEmitter<string>();

  readonly searchQuery = signal<string>('');
  readonly isSearchFocused = signal<boolean>(false);
  readonly isCategoryMenuOpen = signal<boolean>(false);
  readonly isMiniCartOpen = signal<boolean>(false);

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

  onSearchInput(val: string) {
    this.searchQuery.set(val);
    this.searchQueryChanged.emit(val);
  }

  clearSearch() {
    this.searchQuery.set('');
    this.searchQueryChanged.emit('');
  }

  toggleCategoryMenu() {
    this.isCategoryMenuOpen.update((v) => !v);
  }

  selectCategory(slugOrId: string | number) {
    this.categorySelected.emit(String(slugOrId));
    this.isCategoryMenuOpen.set(false);
  }
}
