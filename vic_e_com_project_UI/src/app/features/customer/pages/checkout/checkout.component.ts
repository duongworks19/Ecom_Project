import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { AddressesApiService } from '../../../account/addresses/data-access/addresses-api.service';
import { CustomerAddress } from '../../../account/addresses/data-access/addresses.models';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { CheckoutService } from './services/checkout.service';
import { AddressSelectModalComponent } from './components/address-select-modal/address-select-modal.component';
import {
  CheckoutPreviewResponse,
  CheckoutRequest,
  CheckoutVoucherInput,
  MAX_CART_ITEMS,
  VOUCHER_ERROR_CODES,
} from './models/checkout.models';

@Component({
  selector: 'vic-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, VndCurrencyPipe, AddressSelectModalComponent],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly checkoutService = inject(CheckoutService);
  private readonly addressService = inject(AddressesApiService);
  private readonly cartState = inject(CartStateService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewTrigger$ = new Subject<void>();

  readonly cartItemIds = signal<number[]>([]);
  readonly addresses = signal<CustomerAddress[]>([]);
  readonly selectedAddress = signal<CustomerAddress | null>(null);
  readonly preview = signal<CheckoutPreviewResponse | null>(null);
  readonly isPreviewLoading = signal(false);
  readonly isPlacingOrder = signal(false);
  readonly isAddressModalOpen = signal(false);
  readonly pageError = signal<string | null>(null);
  readonly networkError = signal<string | null>(null);

  // Vouchers state: map shopId -> voucher code
  readonly shopVouchers = signal<Map<number, string>>(new Map());
  readonly shopVoucherErrors = signal<Map<number, string>>(new Map());
  readonly voucherInputs = signal<Map<number, string>>(new Map());

  // Last successful preview cache
  private lastGoodPreview: { request: CheckoutRequest; response: CheckoutPreviewResponse } | null = null;
  private pendingVoucherShopId: number | null = null;

  ngOnInit(): void {
    const rawIds = this.route.snapshot.queryParamMap.get('cartItemIds') || this.route.snapshot.queryParamMap.get('items');
    const ids = this.parseCartItemIds(rawIds);

    if (ids.length === 0 || ids.length > MAX_CART_ITEMS) {
      this.toast.error('Danh sách sản phẩm thanh toán không hợp lệ');
      void this.router.navigate(['/cart']);
      return;
    }
    this.cartItemIds.set(ids);

    this.setupPreviewPipeline();
    this.loadAddresses();
  }

  private parseCartItemIds(raw: string | null): number[] {
    if (!raw) return [];
    const parts = raw.split(',').map((s) => Number(s.trim()));
    const valid = parts.filter((n) => Number.isInteger(n) && n > 0);
    return Array.from(new Set(valid));
  }

  private setupPreviewPipeline(): void {
    this.previewTrigger$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => {
          this.isPreviewLoading.set(true);
          this.pageError.set(null);
          this.networkError.set(null);
          const req = this.buildCurrentRequest();
          return this.checkoutService.getPreview(req);
        })
      )
      .subscribe({
        next: (res) => {
          this.preview.set(res);
          this.lastGoodPreview = { request: this.buildCurrentRequest(), response: res };
          this.pendingVoucherShopId = null;
          this.isPreviewLoading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.handlePreviewError(err);
          this.isPreviewLoading.set(false);
        },
      });
  }

  private loadAddresses(): void {
    this.addressService.listAddresses().subscribe({
      next: (list) => {
        this.addresses.set(list);
        if (list.length > 0) {
          const def = list.find((a) => a.isDefault) || list[0];
          this.selectedAddress.set(def);
          this.previewTrigger$.next();
        }
      },
      error: () => this.pageError.set('Không thể tải danh sách địa chỉ nhận hàng'),
    });
  }

  private buildCurrentRequest(): CheckoutRequest {
    const vouchers: CheckoutVoucherInput[] = [];
    this.shopVouchers().forEach((code, shopId) => {
      if (code && code.trim()) vouchers.push({ shopId, code: code.trim() });
    });
    return {
      cartItemIds: this.cartItemIds(),
      addressId: this.selectedAddress()?.id ?? 0,
      vouchers,
      paymentMethod: 'COD',
    };
  }

  private handlePreviewError(err: HttpErrorResponse): void {
    const errBody = err.error || {};
    const code = errBody.code || '';
    const message = errBody.message || 'Lỗi kiểm tra thông tin đơn hàng';

    if (err.status === 422 && VOUCHER_ERROR_CODES.has(code) && this.pendingVoucherShopId !== null) {
      const targetShopId = this.pendingVoucherShopId;
      const nextErrors = new Map(this.shopVoucherErrors());
      nextErrors.set(targetShopId, message);
      this.shopVoucherErrors.set(nextErrors);

      const nextVouchers = new Map(this.shopVouchers());
      nextVouchers.delete(targetShopId);
      this.shopVouchers.set(nextVouchers);

      if (this.lastGoodPreview) {
        this.preview.set(this.lastGoodPreview.response);
      }
      this.pendingVoucherShopId = null;
      return;
    }

    if (err.status === 404) {
      this.pageError.set('Sản phẩm hoặc địa chỉ không còn tồn tại.');
    } else {
      this.pageError.set(message);
    }
  }

  applyVoucher(shopId: number, codeInput: string): void {
    const code = codeInput ? codeInput.trim() : '';
    const nextErrors = new Map(this.shopVoucherErrors());

    if (!code || code.length > 50 || /\s/.test(code)) {
      nextErrors.set(shopId, 'Mã voucher không hợp lệ (không chứa khoảng trắng, tối đa 50 ký tự)');
      this.shopVoucherErrors.set(nextErrors);
      return;
    }

    nextErrors.delete(shopId);
    this.shopVoucherErrors.set(nextErrors);

    const nextVouchers = new Map(this.shopVouchers());
    nextVouchers.set(shopId, code);
    this.shopVouchers.set(nextVouchers);
    this.pendingVoucherShopId = shopId;
    this.previewTrigger$.next();
  }

  removeVoucher(shopId: number): void {
    const nextVouchers = new Map(this.shopVouchers());
    nextVouchers.delete(shopId);
    this.shopVouchers.set(nextVouchers);

    const nextErrors = new Map(this.shopVoucherErrors());
    nextErrors.delete(shopId);
    this.shopVoucherErrors.set(nextErrors);

    const nextInputs = new Map(this.voucherInputs());
    nextInputs.delete(shopId);
    this.voucherInputs.set(nextInputs);

    this.pendingVoucherShopId = null;
    this.previewTrigger$.next();
  }

  onAddressSelected(addr: CustomerAddress): void {
    this.selectedAddress.set(addr);
    this.isAddressModalOpen.set(false);
    this.previewTrigger$.next();
  }

  onPlaceOrder(): void {
    if (this.isPlacingOrder() || this.isPreviewLoading() || !this.selectedAddress() || !this.preview()) {
      return;
    }
    this.isPlacingOrder.set(true);
    this.pageError.set(null);
    this.networkError.set(null);

    const req = this.buildCurrentRequest();
    this.checkoutService.placeOrder(req).subscribe({
      next: (res) => {
        this.cartState.refreshCount();
        void this.router.navigate(['/checkout/success'], {
          replaceUrl: true,
          state: { placed: res },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.isPlacingOrder.set(false);
        if (err.status === 0) {
          this.networkError.set(
            'Chưa xác nhận được đơn đã được tạo hay chưa. Vui lòng kiểm tra lịch sử đơn hàng trước khi đặt lại.'
          );
        } else {
          this.pageError.set(err.error?.message || 'Không thể tạo đơn hàng, vui lòng thử lại.');
        }
      },
    });
  }

  formatAddress(addr: CustomerAddress | null): string {
    if (!addr) return '';
    return [addr.streetAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(', ');
  }
}
