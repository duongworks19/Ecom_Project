import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartItemWithTotal } from '../../models/cart.models';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-cart-item-row',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe],
  templateUrl: './cart-item-row.component.html',
  styleUrl: './cart-item-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartItemRowComponent {
  @Input({ required: true }) item!: CartItemWithTotal;
  @Input() isChecked = false;
  @Input() isUpdating = false;

  @Output() toggleCheck = new EventEmitter<boolean>();
  @Output() quantityChange = new EventEmitter<number>();
  @Output() variantChangeRequested = new EventEmitter<CartItemWithTotal>();
  @Output() deleteItem = new EventEmitter<number>();

  onCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.toggleCheck.emit(input.checked);
  }

  onDecrease(): void {
    if (this.item.quantity > 1 && !this.isUpdating) {
      this.quantityChange.emit(this.item.quantity - 1);
    }
  }

  onIncrease(): void {
    if (this.item.quantity < this.item.stockQty && !this.isUpdating) {
      this.quantityChange.emit(this.item.quantity + 1);
    }
  }

  onQuantityInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    if (isNaN(val) || val < 1) {
      val = 1;
    } else if (val > this.item.stockQty) {
      val = this.item.stockQty;
    }
    input.value = String(val);
    if (val !== this.item.quantity) {
      this.quantityChange.emit(val);
    }
  }

  onRequestVariantChange(): void {
    if (!this.isUpdating) {
      this.variantChangeRequested.emit(this.item);
    }
  }

  onDelete(): void {
    if (!this.isUpdating) {
      this.deleteItem.emit(this.item.itemId);
    }
  }
}
