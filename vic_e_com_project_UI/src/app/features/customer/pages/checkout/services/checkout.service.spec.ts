import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { CheckoutComponent } from '../checkout.component';
import { CheckoutService, buildCheckoutRequestBody } from './checkout.service';
import { AddressesApiService } from '../../../../account/addresses/data-access/addresses-api.service';
import { CartStateService } from '../../../../cart/services/cart-state.service';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { CheckoutRequest } from '../models/checkout.models';

describe('Checkout Component & Request Constraints', () => {
  it('buildCheckoutRequestBody produces ONLY the 4 allowed keys', () => {
    const raw: any = {
      cartItemIds: [101, 102],
      addressId: 12,
      vouchers: [{ shopId: 1, code: 'SALE20' }],
      paymentMethod: 'COD',
      unitPrice: 50000,
      subtotal: 100000,
      shippingFee: 30000,
      discountAmount: 20000,
      total: 110000,
      grandTotal: 110000,
    };

    const cleaned = buildCheckoutRequestBody(raw as CheckoutRequest);
    const keys = Object.keys(cleaned).sort();

    expect(keys).toEqual(['addressId', 'cartItemIds', 'paymentMethod', 'vouchers']);
    expect((cleaned as any).unitPrice).toBeUndefined();
    expect((cleaned as any).total).toBeUndefined();
    expect((cleaned as any).shippingFee).toBeUndefined();
    expect((cleaned as any).discountAmount).toBeUndefined();
  });

  it('clicking place order twice consecutively sends only ONE request', () => {
    const placeOrder$ = new Subject<any>();
    const placeOrderSpy = vi.fn().mockReturnValue(placeOrder$);

    const mockCheckoutService = {
      getPreview: vi.fn().mockReturnValue(new Subject<any>()),
      placeOrder: placeOrderSpy,
    };

    const mockAddressesService = {
      listAddresses: vi.fn().mockReturnValue(new Subject<any>()),
    };

    const mockCartState = {
      refreshCount: vi.fn(),
    };

    const mockToast = {
      error: vi.fn(),
      success: vi.fn(),
    };

    const mockRouter = {
      navigate: vi.fn().mockResolvedValue(true),
    };

    const mockActivatedRoute = {
      snapshot: {
        queryParamMap: {
          get: (key: string) => (key === 'cartItemIds' ? '1,2' : null),
        },
      },
    };

    TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [
        { provide: CheckoutService, useValue: mockCheckoutService },
        { provide: AddressesApiService, useValue: mockAddressesService },
        { provide: CartStateService, useValue: mockCartState },
        { provide: ToastService, useValue: mockToast },
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    });

    const fixture = TestBed.createComponent(CheckoutComponent);
    const comp = fixture.componentInstance;

    // Set valid state so that place order condition passes
    comp.selectedAddress.set({
      id: 1,
      recipientName: 'Test',
      phone: '0901234567',
      streetAddress: '123 St',
      ward: 'W',
      district: 'D',
      province: 'P',
      isDefault: true,
    });
    comp.preview.set({
      shops: [],
      grandTotal: 200000,
    });

    // First click: triggers placeOrder
    comp.onPlaceOrder();
    expect(placeOrderSpy).toHaveBeenCalledTimes(1);

    // Second click immediately: should be ignored because isPlacingOrder() is true
    comp.onPlaceOrder();
    expect(placeOrderSpy).toHaveBeenCalledTimes(1);
  });
});
