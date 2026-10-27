import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnChanges,
  Output,
  EventEmitter,
  inject,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CartApiService } from '../../services/cart-api.service';
import { CartStateService } from '../../services/cart-state.service';
import { CartItemWithTotal, CartShopGroup } from '../../models/cart.models';
import { mapItemsWithTotal } from '../../utils/cart-calc';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { mapApiError } from '../../../../shared/utils/api-error-messages';
import { HttpErrorResponse } from '@angular/common/http';

/** Số dòng tối đa hiển thị trong mini-cart.
 * // ponytail: tạm tính chỉ của 3 dòng hiển thị; nâng cấp bằng summary endpoint nếu BE thêm. */
const MAX_PREVIEW = 3;

@Component({
  selector: 'app-mini-cart',
  standalone: true,
  imports: [RouterLink, VndCurrencyPipe],
  templateUrl: './mini-cart.component.html',
  styleUrl: './mini-cart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MiniCartComponent implements OnChanges {
  private readonly api = inject(CartApiService);
  private readonly cartState = inject(CartStateService);
  private readonly elRef = inject(ElementRef);

  readonly isOpen = input.required<boolean>();
  @Output() readonly closed = new EventEmitter<void>();

  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly previewItems = signal<CartItemWithTotal[]>([]);
  readonly subtotal = signal(0);

  readonly maxPreview = MAX_PREVIEW;

  ngOnChanges(): void {
    if (this.isOpen()) {
      this.loadCart();
    }
  }

  loadCart(): void {
    this.isLoading.set(true);
    this.errorMsg.set(null);

    this.api.getCart().subscribe({
      next: (cart) => {
        const allAvailable = cart.shops.flatMap((s: CartShopGroup) =>
          mapItemsWithTotal(s.items)
        );
        const preview = allAvailable.slice(0, MAX_PREVIEW);
        this.previewItems.set(preview);
        this.subtotal.set(preview.reduce((s, i) => s + i.lineTotal, 0));
        this.cartState.refreshCount();
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg.set(mapApiError(err));
        this.isLoading.set(false);
      },
    });
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen()) {
      this.close();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.elRef.nativeElement.contains(event.target)) {
      this.close();
    }
  }
}
