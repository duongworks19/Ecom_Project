import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { CartApiService } from '../../services/cart-api.service';
import { CartStateService } from '../../services/cart-state.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { mapApiError } from '../../../../shared/utils/api-error-messages';
import {
  CartResponse,
  CartShopGroup,
  CartItemWithTotal,
} from '../../models/cart.models';
import { mapItemsWithTotal, calcSelectedTotal } from '../../utils/cart-calc';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { CartTableHeadComponent } from '../../components/cart-table-head/cart-table-head.component';
import { CartShopGroupComponent } from '../../components/cart-shop-group/cart-shop-group.component';
import { CartUnavailableGroupComponent } from '../../components/cart-unavailable-group/cart-unavailable-group.component';
import { CartBottomBarComponent } from '../../components/cart-bottom-bar/cart-bottom-bar.component';
import {
  VariantPickerDialogComponent,
  VariantPickerResult,
} from '../../components/variant-picker-dialog/variant-picker-dialog.component';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    SkeletonComponent,
    CartTableHeadComponent,
    CartShopGroupComponent,
    CartUnavailableGroupComponent,
    CartBottomBarComponent,
    VariantPickerDialogComponent,
  ],
  templateUrl: './cart-page.component.html',
  styleUrl: './cart-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartPageComponent implements OnInit {
  private readonly cartApi = inject(CartApiService);
  private readonly cartState = inject(CartStateService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  readonly cart = signal<CartResponse | null>(null);
  readonly isLoading = signal(true);
  readonly errorMsg = signal<string | null>(null);

  readonly selectedItemIds = signal<Set<number>>(new Set());
  readonly updatingItemIds = signal<Set<number>>(new Set());
  readonly isDeletingUnavailable = signal(false);
  readonly isBulkDeleting = signal(false);

  // Variant picker dialog state
  readonly isVariantPickerOpen = signal(false);
  readonly activeEditingItem = signal<CartItemWithTotal | null>(null);

  // All available items flattened with lineTotal
  readonly allAvailableItems = computed<CartItemWithTotal[]>(() => {
    const c = this.cart();
    if (!c || !c.shops) return [];
    return c.shops.flatMap((shop) => mapItemsWithTotal(shop.items));
  });

  readonly totalAvailableCount = computed(() => this.allAvailableItems().length);

  readonly selectedCount = computed(() => {
    const selected = this.selectedItemIds();
    return this.allAvailableItems().filter((item) => selected.has(item.itemId)).length;
  });

  readonly isAllChecked = computed(() => {
    const total = this.totalAvailableCount();
    return total > 0 && this.selectedCount() === total;
  });

  readonly totalSelectedAmount = computed(() => {
    return calcSelectedTotal(this.allAvailableItems(), this.selectedItemIds());
  });

  readonly unavailableItems = computed(() => this.cart()?.unavailableItems || []);

  readonly isCartEmpty = computed(() => {
    const c = this.cart();
    if (!c) return false;
    return this.totalAvailableCount() === 0 && this.unavailableItems().length === 0;
  });

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.errorMsg.set(null);
    this.cartApi.getCart().subscribe({
      next: (res) => {
        this.cart.set(res);
        // Giữ lại các ID đã chọn nếu chúng vẫn còn tồn tại trong cart mới
        const currentValidIds = new Set(
          res.shops.flatMap((s) => s.items.map((i) => i.itemId))
        );
        this.selectedItemIds.update((prev) => {
          const next = new Set<number>();
          for (const id of prev) {
            if (currentValidIds.has(id)) next.add(id);
          }
          return next;
        });

        this.cartState.refreshCount();
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg.set(mapApiError(err));
        this.isLoading.set(false);
      },
    });
  }

  getShopItemsWithTotal(shop: CartShopGroup): CartItemWithTotal[] {
    return mapItemsWithTotal(shop.items);
  }

  onToggleAll(checked: boolean): void {
    if (checked) {
      const allIds = new Set(this.allAvailableItems().map((i) => i.itemId));
      this.selectedItemIds.set(allIds);
    } else {
      this.selectedItemIds.set(new Set());
    }
  }

  onToggleShop(shop: CartShopGroup, checked: boolean): void {
    const shopItemIds = shop.items.map((i) => i.itemId);
    this.selectedItemIds.update((prev) => {
      const next = new Set(prev);
      for (const id of shopItemIds) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  onToggleItem(event: { itemId: number; checked: boolean }): void {
    this.selectedItemIds.update((prev) => {
      const next = new Set(prev);
      if (event.checked) {
        next.add(event.itemId);
      } else {
        next.delete(event.itemId);
      }
      return next;
    });
  }

  onQuantityChange(event: { itemId: number; quantity: number }): void {
    this.updatingItemIds.update((s) => new Set(s).add(event.itemId));

    this.cartApi.updateItem(event.itemId, { quantity: event.quantity }).subscribe({
      next: () => {
        this.updatingItemIds.update((s) => {
          const next = new Set(s);
          next.delete(event.itemId);
          return next;
        });
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingItemIds.update((s) => {
          const next = new Set(s);
          next.delete(event.itemId);
          return next;
        });
        this.toast.error(mapApiError(err));
      },
    });
  }

  onRequestVariantChange(item: CartItemWithTotal): void {
    this.activeEditingItem.set(item);
    this.isVariantPickerOpen.set(true);
  }

  onVariantConfirmed(result: VariantPickerResult): void {
    const current = this.activeEditingItem();
    if (!current) return;

    if (current.variantId === result.variantId) {
      return; // Không đổi
    }

    this.updatingItemIds.update((s) => new Set(s).add(current.itemId));

    this.cartApi.updateItem(current.itemId, { variantId: result.variantId }).subscribe({
      next: () => {
        this.toast.success('Đã cập nhật phân loại sản phẩm');
        this.updatingItemIds.update((s) => {
          const next = new Set(s);
          next.delete(current.itemId);
          return next;
        });
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingItemIds.update((s) => {
          const next = new Set(s);
          next.delete(current.itemId);
          return next;
        });
        this.toast.error(mapApiError(err));
      },
    });
  }

  onDeleteItem(itemId: number): void {
    this.updatingItemIds.update((s) => new Set(s).add(itemId));

    this.cartApi.deleteItem(itemId).subscribe({
      next: () => {
        this.selectedItemIds.update((s) => {
          const next = new Set(s);
          next.delete(itemId);
          return next;
        });
        this.toast.success('Đã xóa sản phẩm khỏi giỏ hàng');
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.updatingItemIds.update((s) => {
          const next = new Set(s);
          next.delete(itemId);
          return next;
        });
        this.toast.error(mapApiError(err));
      },
    });
  }

  onDeleteSelected(): void {
    const ids = Array.from(this.selectedItemIds());
    if (ids.length === 0) return;

    this.isBulkDeleting.set(true);

    this.cartApi.bulkDelete({ itemIds: ids }).subscribe({
      next: () => {
        this.selectedItemIds.set(new Set());
        this.isBulkDeleting.set(false);
        this.toast.success(`Đã xóa ${ids.length} sản phẩm đã chọn`);
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.isBulkDeleting.set(false);
        this.toast.error(mapApiError(err));
      },
    });
  }

  onDeleteAllUnavailable(): void {
    this.isDeletingUnavailable.set(true);

    this.cartApi.deleteUnavailable().subscribe({
      next: (removed) => {
        this.isDeletingUnavailable.set(false);
        this.toast.success(`Đã xóa ${removed} sản phẩm không khả dụng`);
        this.loadCart();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeletingUnavailable.set(false);
        this.toast.error(mapApiError(err));
      },
    });
  }

  onCheckout(): void {
    if (this.selectedCount() === 0) return;
    const itemIds = Array.from(this.selectedItemIds());
    void this.router.navigate(['/checkout'], {
      queryParams: { cartItemIds: itemIds.join(',') },
    });
  }
}
