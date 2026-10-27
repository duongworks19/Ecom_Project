import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  CartResponse,
  CartCountResponse,
  AddToCartRequest,
  UpdateCartItemRequest,
  BulkDeleteRequest,
} from '../models/cart.models';
import { ProductVariantsResponse } from '../models/product-variant.models';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/cart`;

  getCart(): Observable<CartResponse> {
    return this.http
      .get<ApiResponse<CartResponse>>(this.base)
      .pipe(map((res) => res.data));
  }

  getCount(): Observable<CartCountResponse> {
    return this.http
      .get<ApiResponse<CartCountResponse>>(`${this.base}/count`)
      .pipe(map((res) => res.data));
  }

  addItem(body: AddToCartRequest): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/items`, body)
      .pipe(map(() => undefined));
  }

  updateItem(itemId: number, body: UpdateCartItemRequest): Observable<void> {
    return this.http
      .patch<ApiResponse<unknown>>(`${this.base}/items/${itemId}`, body)
      .pipe(map(() => undefined));
  }

  deleteItem(itemId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/items/${itemId}`)
      .pipe(map(() => undefined));
  }

  bulkDelete(body: BulkDeleteRequest): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(`${this.base}/items/bulk-delete`, body)
      .pipe(map(() => undefined));
  }

  deleteUnavailable(): Observable<number> {
    return this.http
      .delete<ApiResponse<{ removed: number }>>(`${this.base}/unavailable`)
      .pipe(map((res) => res.data.removed));
  }

  getVariants(productId: number): Observable<ProductVariantsResponse> {
    return this.http
      .get<ApiResponse<ProductVariantsResponse>>(`${environment.apiUrl}/products/${productId}/variants`)
      .pipe(map((res) => res.data));
  }
}
