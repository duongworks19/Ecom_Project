import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
  CheckoutPreviewResponse,
  CheckoutRequest,
  PlaceOrderResponse,
} from '../models/checkout.models';

export function buildCheckoutRequestBody(req: CheckoutRequest): CheckoutRequest {
  return {
    cartItemIds: req.cartItemIds,
    addressId: req.addressId,
    vouchers: req.vouchers,
    paymentMethod: req.paymentMethod || 'COD',
  };
}

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  private readonly http = inject(HttpClient);
  private readonly previewUrl = `${environment.apiUrl}/customer/checkout/preview`;
  private readonly ordersUrl = `${environment.apiUrl}/customer/orders`;

  getPreview(request: CheckoutRequest): Observable<CheckoutPreviewResponse> {
    const body = buildCheckoutRequestBody(request);
    return this.http.post<CheckoutPreviewResponse>(this.previewUrl, body);
  }

  placeOrder(request: CheckoutRequest): Observable<PlaceOrderResponse> {
    const body = buildCheckoutRequestBody(request);
    return this.http.post<PlaceOrderResponse>(this.ordersUrl, body);
  }
}

