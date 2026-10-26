import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryItem } from '../../models/admin-category.model';

@Component({
  selector: 'vic-category-detail-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-detail-panel.component.html',
  styleUrl: './category-detail-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDetailPanelComponent {
  @Input() category: CategoryItem | null = null;
  @Input() parentName: string | null = null;
  @Input() maxDepth = 3;

  @Output() addChild = new EventEmitter<CategoryItem>();
  @Output() edit = new EventEmitter<CategoryItem>();
  @Output() toggleStatus = new EventEmitter<CategoryItem>();
  @Output() delete = new EventEmitter<CategoryItem>();

  get isMaxDepth(): boolean {
    return !!this.category && this.category.level >= this.maxDepth;
  }

  get canDelete(): boolean {
    return (
      !!this.category &&
      this.category.totalProductCount === 0 &&
      this.category.childCount === 0
    );
  }

  get breadcrumb(): string {
    if (!this.category?.pathNames?.length) return '';
    return this.category.pathNames.join(' › ');
  }

  onAddChild(): void {
    if (this.category && !this.isMaxDepth) {
      this.addChild.emit(this.category);
    }
  }

  onEdit(): void {
    if (this.category) {
      this.edit.emit(this.category);
    }
  }

  onToggleStatus(): void {
    if (this.category) {
      this.toggleStatus.emit(this.category);
    }
  }

  onDelete(): void {
    if (this.category && this.canDelete) {
      this.delete.emit(this.category);
    }
  }
}
