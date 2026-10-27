import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartShopGroup, CartItemWithTotal } from '../../models/cart.models';
import { CartItemRowComponent } from '../cart-item-row/cart-item-row.component';

@Component({
  selector: 'app-cart-shop-group',
  standalone: true,
  imports: [CommonModule, RouterLink, CartItemRowComponent],
  templateUrl: './cart-shop-group.component.html',
  styleUrl: './cart-shop-group.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartShopGroupComponent {
  @Input({ required: true }) shop!: CartShopGroup;
  @Input({ required: true }) itemsWithTotal: CartItemWithTotal[] = [];
  @Input({ required: true }) selectedItemIds = new Set<number>();
  @Input() updatingItemIds = new Set<number>();

  @Output() toggleShop = new EventEmitter<boolean>();
  @Output() toggleItem = new EventEmitter<{ itemId: number; checked: boolean }>();
  @Output() quantityChange = new EventEmitter<{ itemId: number; quantity: number }>();
  @Output() variantChangeRequested = new EventEmitter<CartItemWithTotal>();
  @Output() deleteItem = new EventEmitter<number>();

  isAllShopItemsChecked(): boolean {
    if (!this.itemsWithTotal || this.itemsWithTotal.length === 0) return false;
    return this.itemsWithTotal.every((item) => this.selectedItemIds.has(item.itemId));
  }

  onShopCheckboxChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.toggleShop.emit(input.checked);
  }

  isItemChecked(itemId: number): boolean {
    return this.selectedItemIds.has(itemId);
  }

  isItemUpdating(itemId: number): boolean {
    return this.updatingItemIds.has(itemId);
  }

  onItemToggle(itemId: number, checked: boolean): void {
    this.toggleItem.emit({ itemId, checked });
  }

  onItemQuantityChange(itemId: number, quantity: number): void {
    this.quantityChange.emit({ itemId, quantity });
  }

  onVariantChangeRequested(item: CartItemWithTotal): void {
    this.variantChangeRequested.emit(item);
  }

  onItemDelete(itemId: number): void {
    this.deleteItem.emit(itemId);
  }
}
