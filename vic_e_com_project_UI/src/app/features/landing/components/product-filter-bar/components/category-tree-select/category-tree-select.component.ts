import {
  Component, ElementRef, EventEmitter, HostListener,
  Input, OnChanges, Output, computed, inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryItem, CategoryTreeNode } from '../../../../../../core/models/category.model';

@Component({
  selector: 'app-category-tree-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-tree-select.component.html',
  styleUrl: './category-tree-select.component.scss',
})
export class CategoryTreeSelectComponent implements OnChanges {
  private readonly elementRef = inject(ElementRef);

  @Input({ required: true }) categories: CategoryItem[] = [];
  @Input() selectedSlug = 'all';
  @Output() selectionChange = new EventEmitter<string>();

  readonly isOpen = signal<boolean>(false);
  readonly currentSlug = signal<string>('all');
  readonly expandedIds = signal<Set<number | string>>(new Set());

  readonly treeNodes = computed<CategoryTreeNode[]>(() => {
    const list = this.categories;
    const nodeMap = new Map<number | string, CategoryTreeNode>();
    const roots: CategoryTreeNode[] = [];

    for (const item of list) {
      nodeMap.set(item.id, { ...item, children: [] });
    }

    for (const item of list) {
      const node = nodeMap.get(item.id)!;
      if (item.parentId && nodeMap.has(item.parentId)) {
        nodeMap.get(item.parentId)!.children.push(node);
      } else if (!item.parentId) {
        roots.push(node);
      }
    }
    return roots.length > 0 ? roots : list.map((i) => ({ ...i, children: [] }));
  });

  readonly displayLabel = computed<string>(() => {
    const slug = this.currentSlug();
    if (!slug || slug === 'all') return 'Tất cả danh mục';
    const match = this.categories.find(
      (c) => c.slug === slug || String(c.id) === slug || String(c.slug).toLowerCase() === slug.toLowerCase()
    );
    return match ? match.name : slug;
  });

  ngOnChanges(): void {
    const incomingSlug = this.selectedSlug || 'all';
    this.currentSlug.set(incomingSlug);
    if (incomingSlug !== 'all') {
      this.expandAncestorsOf(incomingSlug);
    }
  }

  toggleDropdown(): void {
    this.isOpen.update((v) => !v);
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  toggleExpand(id: number | string, event: Event): void {
    event.stopPropagation();
    const current = new Set(this.expandedIds());
    if (current.has(id)) {
      current.delete(id);
    } else {
      current.add(id);
    }
    this.expandedIds.set(current);
  }

  isExpanded(id: number | string): boolean {
    return this.expandedIds().has(id);
  }

  selectCategory(slug: string, event?: Event): void {
    if (event) event.stopPropagation();
    const targetSlug = slug || 'all';
    this.currentSlug.set(targetSlug);
    this.selectionChange.emit(targetSlug);
    this.closeDropdown();
  }

  isSelected(slug: string): boolean {
    return this.currentSlug() === slug;
  }

  private expandAncestorsOf(slug: string): void {
    const target = this.categories.find(
      (c) => c.slug === slug || String(c.id) === slug || String(c.slug).toLowerCase() === slug.toLowerCase()
    );
    if (!target) return;

    const toExpand = new Set(this.expandedIds());
    let currentParentId = target.parentId;

    while (currentParentId) {
      toExpand.add(currentParentId);
      const parent = this.categories.find((c) => c.id === currentParentId);
      currentParentId = parent ? parent.parentId : null;
    }
    this.expandedIds.set(toExpand);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }
}
