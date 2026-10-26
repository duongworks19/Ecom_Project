import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  computed,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryItem, CategoryTreeNode } from '../../models/admin-category.model';
import { buildCategoryTree, flattenCategoryTree } from '../../utils/category-tree.util';

@Component({
  selector: 'vic-category-tree-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-tree-panel.component.html',
  styleUrl: './category-tree-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryTreePanelComponent {
  private readonly _items = signal<CategoryItem[]>([]);

  @Input({ required: true })
  set items(val: CategoryItem[]) {
    this._items.set(val || []);
    // Initial auto-expand: nếu chưa có expandedIds nào, mở rộng level 1 & level 2 có con
    if (this.expandedIds().size === 0 && val?.length) {
      const initialExpand = new Set<number>();
      for (const item of val) {
        if (item.childCount > 0 && item.level <= 2) {
          initialExpand.add(item.id);
        }
      }
      this.expandedIds.set(initialExpand);
    }
  }

  @Input() selectedId: number | null = null;
  @Input() maxDepth = 3;

  @Output() selectCategory = new EventEmitter<CategoryItem>();

  readonly expandedIds = signal<Set<number>>(new Set<number>());

  readonly parentCategoryIds = computed(() => {
    return this._items()
      .filter((item) => item.childCount > 0)
      .map((item) => item.id);
  });

  readonly isAllExpanded = computed(() => {
    const parentIds = this.parentCategoryIds();
    if (parentIds.length === 0) return true;
    const currentExpanded = this.expandedIds();
    return parentIds.every((id) => currentExpanded.has(id));
  });

  readonly isAllCollapsed = computed(() => {
    const parentIds = this.parentCategoryIds();
    if (parentIds.length === 0) return true;
    const currentExpanded = this.expandedIds();
    return parentIds.every((id) => !currentExpanded.has(id));
  });

  readonly tree = computed(() => {
    return buildCategoryTree(this._items(), this.expandedIds());
  });

  readonly visibleNodes = computed(() => {
    return flattenCategoryTree(this.tree());
  });

  toggleNode(node: CategoryTreeNode, event: MouseEvent): void {
    event.stopPropagation();
    const next = new Set(this.expandedIds());
    if (next.has(node.id)) {
      next.delete(node.id);
    } else {
      next.add(node.id);
    }
    this.expandedIds.set(next);
  }

  expandAll(): void {
    const allParents = new Set(this.parentCategoryIds());
    this.expandedIds.set(allParents);
  }

  collapseAll(): void {
    this.expandedIds.set(new Set());
  }

  onSelectNode(node: CategoryTreeNode): void {
    this.selectCategory.emit(node);
  }
}
