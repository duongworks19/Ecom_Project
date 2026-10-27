import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  computed,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WishlistItem } from '../../models/wishlist.models';
import { WishlistHeartButtonComponent } from '../wishlist-heart-button/wishlist-heart-button.component';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { CartApiService } from '../../../cart/services/cart-api.service';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { mapApiError } from '../../../../shared/utils/api-error-messages';
import { HttpErrorResponse } from '@angular/common/http';
import {
  VariantPickerDialogComponent,
  VariantPickerResult,
} from '../../../cart/components/variant-picker-dialog/variant-picker-dialog.component';

@Component({
  selector: 'app-wishlist-card',
  standalone: true,
  imports: [
    RouterLink,
    DecimalPipe,
    WishlistHeartButtonComponent,
    VndCurrencyPipe,
    VariantPickerDialogComponent,
  ],
  templateUrl: './wishlist-card.component.html',
  styleUrl: './wishlist-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistCardComponent {
  private readonly cartApi = inject(CartApiService);
  private readonly cartState = inject(CartStateService);
  private readonly toast = inject(ToastService);

  readonly item = input.required<WishlistItem>();
  readonly addedToCart = output<void>();
  readonly heartToggled = output<void>();

  readonly isAddingToCart = signal(false);
  readonly isPickerOpen = signal(false);

  onHeartClick(): void {
    this.heartToggled.emit();
  }

  readonly priceLabel = computed(() => {
    const i = this.item();
    return i.hasMultipleVariants
      ? `Từ ${i.minPrice}`
      : i.minPrice;
  });

  onAddToCart(): void {
    const i = this.item();
    if (!i.available || this.isAddingToCart()) {
      return;
    }

    if (i.hasMultipleVariants || !i.defaultVariantId) {
      this.isPickerOpen.set(true);
      return;
    }

    this.isAddingToCart.set(true);

    this.cartApi.addItem({ variantId: i.defaultVariantId, quantity: 1 }).subscribe({
      next: () => {
        this.cartState.refreshCount();
        this.toast.success('Đã thêm vào giỏ hàng');
        this.addedToCart.emit();
        this.isAddingToCart.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(mapApiError(err));
        this.isAddingToCart.set(false);
      },
    });
  }

  onVariantConfirmed(result: VariantPickerResult): void {
    this.isAddingToCart.set(true);

    this.cartApi.addItem(result).subscribe({
      next: () => {
        this.cartState.refreshCount();
        this.toast.success('Đã thêm vào giỏ hàng');
        this.addedToCart.emit();
        this.isAddingToCart.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(mapApiError(err));
        this.isAddingToCart.set(false);
      },
    });
  }
}
