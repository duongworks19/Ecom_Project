import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import {
  CategoryFilterStatus,
  CategoryItem,
  CategoryStatus,
  CategorySummary,
  UpsertCategoryRequest,
} from '../../models/admin-category.model';
import { AdminCategoryService } from '../../services/admin-category.service';
import { findDescendants } from '../../utils/category-tree.util';
import { CategoryTreePanelComponent } from '../../components/category-tree-panel/category-tree-panel.component';
import { CategoryDetailPanelComponent } from '../../components/category-detail-panel/category-detail-panel.component';
import { CategoryUpsertModalComponent } from '../../components/category-upsert-modal/category-upsert-modal.component';
import { CategoryStatusModalComponent } from '../../components/category-status-modal/category-status-modal.component';

@Component({
  selector: 'vic-admin-category-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CategoryTreePanelComponent,
    CategoryDetailPanelComponent,
    CategoryUpsertModalComponent,
    CategoryStatusModalComponent,
  ],
  templateUrl: './admin-category-page.component.html',
  styleUrl: './admin-category-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoryPageComponent implements OnInit {
  private readonly categoryService = inject(AdminCategoryService);

  readonly summary = signal<CategorySummary>({
    totalCategories: 0,
    visibleCategories: 0,
    hiddenCategories: 0,
  });
  readonly maxDepth = signal<number>(3);
  readonly allCategories = signal<CategoryItem[]>([]);
  readonly selectedCategory = signal<CategoryItem | null>(null);

  readonly searchKeyword = signal<string>('');
  readonly selectedStatus = signal<CategoryFilterStatus>('ALL');

  readonly isLoading = signal<boolean>(true);
  readonly pageError = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // Modals state
  readonly isUpsertModalOpen = signal<boolean>(false);
  readonly editingCategory = signal<CategoryItem | null>(null);
  readonly initialParentId = signal<number | null>(null);
  readonly isUpsertSubmitting = signal<boolean>(false);

  readonly isStatusModalOpen = signal<boolean>(false);
  readonly statusTargetCategory = signal<CategoryItem | null>(null);
  readonly statusModalMode = signal<'HIDE' | 'SHOW'>('HIDE');
  readonly isStatusSubmitting = signal<boolean>(false);

  private readonly searchSubject$ = new Subject<string>();

  readonly parentNameOfSelected = computed(() => {
    const sel = this.selectedCategory();
    if (!sel || !sel.parentId) return null;
    const parent = this.allCategories().find((c) => c.id === sel.parentId);
    return parent ? parent.name : null;
  });

  readonly statusDescendants = computed(() => {
    const target = this.statusTargetCategory();
    if (!target) return [];
    return findDescendants(this.allCategories(), target.id);
  });

  ngOnInit(): void {
    this.searchSubject$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((kw) => {
        this.searchKeyword.set(kw);
        this.loadCategories(this.selectedCategory()?.id);
      });

    this.loadCategories();
  }

  onSearchInput(kw: string): void {
    this.searchSubject$.next(kw);
  }

  onStatusFilterChange(status: CategoryFilterStatus): void {
    this.selectedStatus.set(status);
    this.loadCategories(this.selectedCategory()?.id);
  }

  loadCategories(preferredSelectedId?: number): void {
    this.isLoading.set(true);
    this.pageError.set(null);

    const apiStatus = this.selectedStatus() === 'ALL' ? undefined : (this.selectedStatus() as CategoryStatus);

    this.categoryService
      .getOverview({
        keyword: this.searchKeyword(),
        status: apiStatus,
      })
      .subscribe({
        next: (res) => {
          this.summary.set(res.summary);
          this.maxDepth.set(res.maxDepth || 3);
          this.allCategories.set(res.items || []);
          this.isLoading.set(false);

          // Restore or pick selection
          if (res.items?.length) {
            const target =
              res.items.find((item) => item.id === preferredSelectedId) ??
              res.items[0];
            this.selectedCategory.set(target);
          } else {
            this.selectedCategory.set(null);
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading.set(false);
          this.pageError.set(
            err.error?.message || 'Không thể tải danh sách danh mục. Vui lòng thử lại.'
          );
        },
      });
  }

  onSelectCategory(cat: CategoryItem): void {
    this.selectedCategory.set(cat);
  }

  // --- Upsert Modal Handlers ---
  openAddModal(parentId: number | null = null): void {
    this.editingCategory.set(null);
    this.initialParentId.set(parentId);
    this.isUpsertModalOpen.set(true);
  }

  openEditModal(cat: CategoryItem): void {
    this.editingCategory.set(cat);
    this.initialParentId.set(cat.parentId);
    this.isUpsertModalOpen.set(true);
  }

  onSaveCategory(payload: UpsertCategoryRequest): void {
    this.isUpsertSubmitting.set(true);
    const editing = this.editingCategory();

    const request$ = editing
      ? this.categoryService.updateCategory(editing.id, payload)
      : this.categoryService.createCategory(payload);

    request$.subscribe({
      next: (saved) => {
        this.isUpsertSubmitting.set(false);
        this.isUpsertModalOpen.set(false);
        this.showToast(
          editing
            ? `Đã cập nhật danh mục "${saved.name}"`
            : `Đã tạo mới danh mục "${saved.name}"`
        );
        this.loadCategories(saved.id);
      },
      error: (err: HttpErrorResponse) => {
        this.isUpsertSubmitting.set(false);
        const msg =
          err.error?.message ||
          (editing
            ? 'Không thể cập nhật danh mục.'
            : 'Không thể tạo danh mục.');
        this.showToast(msg);
      },
    });
  }

  // --- Status Modal Handlers ---
  openStatusModal(cat: CategoryItem): void {
    this.statusTargetCategory.set(cat);
    this.statusModalMode.set(cat.status === 'VISIBLE' ? 'HIDE' : 'SHOW');
    this.isStatusModalOpen.set(true);
  }

  onConfirmStatusChange(event: { category: CategoryItem; status: CategoryStatus }): void {
    this.isStatusSubmitting.set(true);

    this.categoryService.changeStatus(event.category.id, event.status).subscribe({
      next: (res) => {
        this.isStatusSubmitting.set(false);
        this.isStatusModalOpen.set(false);
        const msg =
          event.status === 'HIDDEN'
            ? `Đã ẩn danh mục "${event.category.name}" và ${res.affectedCount - 1} mục con liên quan.`
            : `Đã hiển thị lại danh mục "${event.category.name}".`;
        this.showToast(msg);
        this.loadCategories(event.category.id);
      },
      error: (err: HttpErrorResponse) => {
        this.isStatusSubmitting.set(false);
        this.showToast(err.error?.message || 'Không thể đổi trạng thái danh mục.');
      },
    });
  }

  // --- Delete Handler ---
  onDeleteCategory(cat: CategoryItem): void {
    if (cat.totalProductCount > 0 || cat.childCount > 0) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa danh mục trống "${cat.name}"?`)) {
      return;
    }

    this.categoryService.deleteCategory(cat.id).subscribe({
      next: () => {
        this.showToast(`Đã xóa danh mục "${cat.name}".`);
        this.selectedCategory.set(null);
        this.loadCategories();
      },
      error: (err: HttpErrorResponse) => {
        this.showToast(err.error?.message || 'Không thể xóa danh mục.');
      },
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }
}
