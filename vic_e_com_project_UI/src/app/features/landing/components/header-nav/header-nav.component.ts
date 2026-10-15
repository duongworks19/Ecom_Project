import { Component, EventEmitter, Input, Output, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CategoryItem } from '../../../../core/models/category.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-header-nav',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  readonly userInitial = computed(() => {
    const name = this.authService.currentUserNameSignal() || 'U';
    return name.trim().charAt(0).toUpperCase();
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

  selectCategory(id: string) {
    this.categorySelected.emit(id);
    this.isCategoryMenuOpen.set(false);
  }

  logout() {
    this.authService.logout();
    void this.router.navigateByUrl('/login');
  }
}
