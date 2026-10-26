import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  CategoryItem,
  CategoryStatus,
  UpsertCategoryRequest,
} from '../../models/admin-category.model';
import { AdminCategoryService } from '../../services/admin-category.service';
import {
  canBeParent,
  generateSlug,
  isValidSlug,
} from '../../utils/category-tree.util';

export interface ParentSelectOption {
  item: CategoryItem | null;
  label: string;
  level: number;
  disabled: boolean;
  disabledReason?: string;
}

@Component({
  selector: 'vic-category-upsert-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-upsert-modal.component.html',
  styleUrl: './category-upsert-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryUpsertModalComponent implements OnChanges {
  private readonly categoryService = inject(AdminCategoryService);

  @Input() isOpen = false;
  @Input() editingCategory: CategoryItem | null = null;
  @Input() initialParentId: number | null = null;
  @Input() allCategories: CategoryItem[] = [];
  @Input() maxDepth = 3;
  @Input() isSubmitting = false;

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<UpsertCategoryRequest>();

  @ViewChild('slugInput') slugInputElement?: ElementRef<HTMLInputElement>;

  name = '';
  parentId: number | null = null;
  slug = '';
  status: CategoryStatus = 'VISIBLE';

  readonly isManualSlug = signal<boolean>(false);
  readonly isSlugChecking = signal<boolean>(false);
  readonly isSlugAvailable = signal<boolean>(true);
  readonly suggestedSlug = signal<string | null>(null);
  readonly slugError = signal<string | null>(null);

  private readonly slugCheck$ = new Subject<string>();

  constructor() {
    this.slugCheck$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((slugVal) => {
          const trimmed = slugVal.trim();
          if (!trimmed) {
            this.isSlugAvailable.set(true);
            this.suggestedSlug.set(null);
            this.slugError.set(null);
            this.isSlugChecking.set(false);
            return of(null);
          }

          if (!isValidSlug(trimmed)) {
            this.isSlugAvailable.set(false);
            this.suggestedSlug.set(null);
            this.slugError.set('Slug chỉ chứa chữ thường, số và dấu gạch ngang (VD: ao-khoac-nam).');
            this.isSlugChecking.set(false);
            return of(null);
          }

          this.isSlugChecking.set(true);
          return this.categoryService.checkSlug(trimmed, this.editingCategory?.id);
        })
      )
      .subscribe({
        next: (res) => {
          this.isSlugChecking.set(false);
          if (!res) return;
          this.isSlugAvailable.set(res.available);
          this.suggestedSlug.set(res.suggestedSlug);
          if (!res.available) {
            this.slugError.set(`Slug '${res.slug}' đã tồn tại trên hệ thống.`);
          } else {
            this.slugError.set(null);
          }
        },
        error: () => {
          this.isSlugChecking.set(false);
        },
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initForm();
    }
  }

  private initForm(): void {
    if (this.editingCategory) {
      this.name = this.editingCategory.name;
      this.parentId = this.editingCategory.parentId;
      this.slug = this.editingCategory.slug;
      this.status = this.editingCategory.status;
      this.isManualSlug.set(true); // Khi sửa giữ slug hiện tại
    } else {
      this.name = '';
      this.parentId = this.initialParentId ?? null;
      this.slug = '';
      this.status = 'VISIBLE';
      this.isManualSlug.set(false);
    }

    this.isSlugAvailable.set(true);
    this.suggestedSlug.set(null);
    this.slugError.set(null);
    this.isSlugChecking.set(false);
  }

  get computedTargetLevel(): number {
    if (this.parentId === null) return 1;
    const parent = this.allCategories.find((c) => c.id === this.parentId);
    return parent ? parent.level + 1 : 1;
  }

  get parentOptions(): ParentSelectOption[] {
    const list: ParentSelectOption[] = [
      {
        item: null,
        label: 'Không có (Danh mục gốc - Cấp 1)',
        level: 1,
        disabled: false,
      },
    ];

    for (const cat of this.allCategories) {
      const check = canBeParent(cat, this.editingCategory?.id ?? null, this.allCategories, this.maxDepth);
      const breadcrumb = cat.pathNames?.length ? cat.pathNames.join(' › ') : cat.name;
      const label = `${breadcrumb} (Cấp ${cat.level})${check.allowed ? '' : ' — ' + check.reason}`;

      list.push({
        item: cat,
        label,
        level: cat.level,
        disabled: !check.allowed,
        disabledReason: check.reason,
      });
    }

    return list;
  }

  onNameChange(val: string): void {
    this.name = val;
    if (!this.isManualSlug()) {
      this.slug = generateSlug(val);
      this.slugCheck$.next(this.slug);
    }
  }

  toggleManualSlug(): void {
    const nextManual = !this.isManualSlug();
    this.isManualSlug.set(nextManual);

    if (nextManual) {
      setTimeout(() => this.slugInputElement?.nativeElement.focus(), 50);
    } else {
      this.slug = generateSlug(this.name);
      this.slugCheck$.next(this.slug);
    }
  }

  onSlugInput(val: string): void {
    this.slug = val.trim().toLowerCase();
    this.slugCheck$.next(this.slug);
  }

  applySuggestedSlug(): void {
    const suggested = this.suggestedSlug();
    if (suggested) {
      this.slug = suggested;
      this.slugCheck$.next(suggested);
    }
  }

  get isFormValid(): boolean {
    const hasName = !!this.name.trim() && this.name.trim().length <= 100;
    const hasSlug = !!this.slug.trim() && isValidSlug(this.slug);
    return hasName && hasSlug && this.isSlugAvailable() && !this.isSlugChecking();
  }

  onSubmit(): void {
    if (!this.isFormValid || this.isSubmitting) return;

    this.save.emit({
      name: this.name.trim(),
      parentId: this.parentId,
      slug: this.slug.trim(),
      status: this.status,
    });
  }

  onClose(): void {
    if (!this.isSubmitting) {
      this.close.emit();
    }
  }
}
