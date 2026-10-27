import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-cart-bottom-bar',
  standalone: true,
  imports: [CommonModule, VndCurrencyPipe],
  templateUrl: './cart-bottom-bar.component.html',
  styleUrl: './cart-bottom-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartBottomBarComponent {
  @Input() allChecked = false;
  @Input() totalAvailableCount = 0;
  @Input() selectedCount = 0;
  @Input() totalAmount = 0;
  @Input() isDeleting = false;

  @Output() toggleAll = new EventEmitter<boolean>();
  @Output() deleteSelected = new EventEmitter<void>();
  @Output() checkout = new EventEmitter<void>();

  onToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.toggleAll.emit(input.checked);
  }

  onDelete(): void {
    if (this.selectedCount > 0 && !this.isDeleting) {
      this.deleteSelected.emit();
    }
  }

  onCheckout(): void {
    if (this.selectedCount > 0) {
      this.checkout.emit();
    }
  }
}
