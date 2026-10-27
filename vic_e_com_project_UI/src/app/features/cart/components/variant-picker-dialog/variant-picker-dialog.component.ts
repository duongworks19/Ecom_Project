import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CartApiService } from '../../services/cart-api.service';
import { ProductVariant } from '../../models/product-variant.models';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { mapApiError } from '../../../../shared/utils/api-error-messages';
import { HttpErrorResponse } from '@angular/common/http';

export interface VariantPickerResult {
  variantId: number;
  quantity: number;
}

@Component({
  selector: 'app-variant-picker-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, VndCurrencyPipe],
  templateUrl: './variant-picker-dialog.component.html',
  styleUrl: './variant-picker-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VariantPickerDialogComponent implements OnChanges {
  private readonly cartApi = inject(CartApiService);

  @Input() isOpen = false;
  @Input() productId: number | null = null;
  @Input() productName = '';
  @Input() imageUrl: string | null = null;
  @Input() currentVariantId: number | null = null;
  @Input() mode: 'change' | 'add' = 'add';
  @Input() initialQuantity = 1;

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<VariantPickerResult>();

  @ViewChild('dialogRef') dialogRef?: ElementRef<HTMLDialogElement>;

  readonly isLoading = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly variants = signal<ProductVariant[]>([]);
  readonly selectedVariantId = signal<number | null>(null);
  readonly quantity = signal(1);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen && this.productId) {
        this.openDialog();
      } else {
        this.closeDialog();
      }
    }
  }

  private openDialog(): void {
    this.errorMsg.set(null);
    this.selectedVariantId.set(this.currentVariantId);
    this.quantity.set(this.initialQuantity || 1);
    this.isLoading.set(true);

    if (this.dialogRef?.nativeElement && !this.dialogRef.nativeElement.open) {
      this.dialogRef.nativeElement.showModal();
    }

    if (this.productId) {
      this.cartApi.getVariants(this.productId).subscribe({
        next: (res) => {
          this.variants.set(res.variants);
          if (!this.selectedVariantId() && res.variants.length > 0) {
            // Tự động chọn biến thể khả dụng đầu tiên
            const firstAvailable = res.variants.find((v) => v.available && v.stockQty > 0);
            this.selectedVariantId.set(firstAvailable ? firstAvailable.variantId : res.variants[0].variantId);
          }
          this.isLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.errorMsg.set(mapApiError(err));
          this.isLoading.set(false);
        },
      });
    }
  }

  private closeDialog(): void {
    if (this.dialogRef?.nativeElement?.open) {
      this.dialogRef.nativeElement.close();
    }
  }

  getSelectedVariant(): ProductVariant | undefined {
    const id = this.selectedVariantId();
    return this.variants().find((v) => v.variantId === id);
  }

  selectVariant(variant: ProductVariant): void {
    if (variant.available && variant.stockQty > 0) {
      this.selectedVariantId.set(variant.variantId);
      // Reset số lượng nếu vượt tồn kho
      if (this.quantity() > variant.stockQty) {
        this.quantity.set(variant.stockQty);
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

  onConfirm(): void {
    const vId = this.selectedVariantId();
    if (!vId) return;

    this.confirmed.emit({
      variantId: vId,
      quantity: this.quantity(),
    });
    this.onClose();
  }

  onClose(): void {
    this.closeDialog();
    this.closed.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) {
      this.onClose();
    }
  }
}
