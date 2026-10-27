import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CartApiService } from '../../../cart/services/cart-api.service';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ProductVariant } from '../../../cart/models/product-variant.models';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { mapApiError } from '../../../../shared/utils/api-error-messages';

@Component({
  selector: 'app-add-to-cart-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe],
  templateUrl: './add-to-cart-panel.component.html',
  styleUrl: './add-to-cart-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddToCartPanelComponent implements OnChanges {
  private readonly cartApi = inject(CartApiService);
  private readonly cartState = inject(CartStateService);
  private readonly authService = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  @Input({ required: true }) productId!: number;
  @Input() defaultVariantId: number | null = null;
  @Input() initialQuantity = 1;

  @Output() addedToCart = new EventEmitter<{ variantId: number; quantity: number }>();

  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly variants = signal<ProductVariant[]>([]);
  readonly selectedVariantId = signal<number | null>(null);
  readonly quantity = signal(1);
  readonly isSubmitting = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['productId'] && this.productId) {
      this.loadVariants();
    }
  }

  loadVariants(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);
    this.quantity.set(this.initialQuantity || 1);

    this.cartApi.getVariants(this.productId).subscribe({
      next: (res) => {
        this.variants.set(res.variants);
        if (this.defaultVariantId) {
          this.selectedVariantId.set(this.defaultVariantId);
        } else if (res.variants.length === 1 && res.variants[0].available && res.variants[0].stockQty > 0) {
          this.selectedVariantId.set(res.variants[0].variantId);
        } else {
          this.selectedVariantId.set(null);
        }
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg.set(mapApiError(err));
        this.isLoading.set(false);
      },
    });
  }

  getSelectedVariant(): ProductVariant | undefined {
    const id = this.selectedVariantId();
    return this.variants().find((v) => v.variantId === id);
  }

  selectVariant(v: ProductVariant): void {
    if (v.available && v.stockQty > 0) {
      this.selectedVariantId.set(v.variantId);
      if (this.quantity() > v.stockQty) {
        this.quantity.set(v.stockQty);
      }
    }
  }

  decreaseQty(): void {
    if (this.quantity() > 1) {
      this.quantity.update((q) => q - 1);
    }
  }

  increaseQty(): void {
    const v = this.getSelectedVariant();
    const max = v ? v.stockQty : 999;
    if (this.quantity() < max) {
      this.quantity.update((q) => q + 1);
    }
  }

  onQuantityChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    let val = parseInt(input.value, 10);
    const v = this.getSelectedVariant();
    const max = v ? v.stockQty : 999;

    if (isNaN(val) || val < 1) {
      val = 1;
    } else if (val > max) {
      val = max;
    }
    input.value = String(val);
    this.quantity.set(val);
  }

  onAddToCart(): void {
    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    const vId = this.selectedVariantId();
    if (!vId) {
      this.toast.error('Vui lòng chọn phân loại hàng trước khi thêm vào giỏ hàng');
      return;
    }

    const v = this.getSelectedVariant();
    if (!v || v.stockQty <= 0) {
      this.toast.error('Phân loại hàng đã hết tồn kho');
      return;
    }

    const qty = this.quantity();
    if (qty > v.stockQty) {
      this.toast.error('Số lượng chọn vượt quá tồn kho hiện có');
      return;
    }

    this.isSubmitting.set(true);

    this.cartApi.addItem({ variantId: vId, quantity: qty }).subscribe({
      next: () => {
        this.cartState.refreshCount();
        this.toast.success('Đã thêm vào giỏ hàng!');
        this.addedToCart.emit({ variantId: vId, quantity: qty });
        this.isSubmitting.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.toast.error(mapApiError(err));
        this.isSubmitting.set(false);
      },
    });
  }
}
