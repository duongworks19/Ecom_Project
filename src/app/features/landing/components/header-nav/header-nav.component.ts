import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategoryItem } from '../../../../core/models/category.model';

@Component({
  selector: 'app-header-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './header-nav.component.html',
  styleUrl: './header-nav.component.scss',
})
export class HeaderNavComponent {
  @Input({ required: true }) categories: CategoryItem[] = [];
  @Input() activeCategoryId = 'all';

  @Output() categorySelected = new EventEmitter<string>();
  @Output() searchQueryChanged = new EventEmitter<string>();

  readonly searchQuery = signal<string>('');
  readonly isSearchFocused = signal<boolean>(false);
  readonly isCategoryMenuOpen = signal<boolean>(false);

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

  selectCategory(id: string) {
    this.categorySelected.emit(id);
    this.isCategoryMenuOpen.set(false);
  }
}
