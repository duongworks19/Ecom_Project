import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CategoryItem, CategoryStatus } from '../../models/admin-category.model';

@Component({
  selector: 'vic-category-status-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './category-status-modal.component.html',
  styleUrl: './category-status-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryStatusModalComponent {
  @Input() isOpen = false;
  @Input() category: CategoryItem | null = null;
  @Input() descendants: CategoryItem[] = [];
  @Input() mode: 'HIDE' | 'SHOW' = 'HIDE';
  @Input() isSubmitting = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{ category: CategoryItem; status: CategoryStatus }>();

  get targetStatus(): CategoryStatus {
    return this.mode === 'HIDE' ? 'HIDDEN' : 'VISIBLE';
  }

  get descendantNamesText(): string {
    if (!this.descendants?.length) return '';
    return this.descendants.map((d) => d.name).join(', ');
  }

  onConfirm(): void {
    if (this.category && !this.isSubmitting) {
      this.confirm.emit({
        category: this.category,
        status: this.targetStatus,
      });
    }
  }

  onClose(): void {
    if (!this.isSubmitting) {
      this.close.emit();
    }
  }
}
