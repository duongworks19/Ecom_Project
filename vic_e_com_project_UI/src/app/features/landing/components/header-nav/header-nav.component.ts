import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryItem, CategoryTreeNode } from '../../../../core/models/category.model';
import { AuthService } from '../../../../core/services/auth.service';
import { UserMenuComponent } from '../../../../layouts/customer-layout/components/user-menu/user-menu.component';

@Component({
  selector: 'app-header-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UserMenuComponent],
  templateUrl: './header-nav.component.html',
  styleUrl: './header-nav.component.scss',
})
export class HeaderNavComponent {
  readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  @Input({ required: true }) categories: CategoryItem[] = [];
  @Input() activeCategoryId = 'all';

  @Output() categorySelected = new EventEmitter<string>();
  @Output() searchQueryChanged = new EventEmitter<string>();

  readonly searchQuery = signal<string>('');
  readonly isSearchFocused = signal<boolean>(false);
  readonly isCategoryMenuOpen = signal<boolean>(false);

  readonly hasHierarchy = computed(() => {
    return this.categories.some((c) => c.parentId !== null && c.parentId !== undefined);
  });

  readonly treeColumns = computed<CategoryTreeNode[]>(() => {
    const list = this.categories;
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
  });

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
