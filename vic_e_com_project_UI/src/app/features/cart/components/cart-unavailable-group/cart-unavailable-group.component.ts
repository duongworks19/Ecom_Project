import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../models/cart.models';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'app-cart-unavailable-group',
  standalone: true,
  imports: [CommonModule, VndCurrencyPipe],
  templateUrl: './cart-unavailable-group.component.html',
  styleUrl: './cart-unavailable-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartUnavailableGroupComponent {
  @Input({ required: true }) items: CartItem[] = [];
  @Input() isDeletingAll = false;

  @Output() deleteAllUnavailable = new EventEmitter<void>();
  @Output() deleteItem = new EventEmitter<number>();

  onDeleteAll(): void {
    if (!this.isDeletingAll) {
      this.deleteAllUnavailable.emit();
    }
  }

  onDelete(itemId: number): void {
    this.deleteItem.emit(itemId);
  }
}
