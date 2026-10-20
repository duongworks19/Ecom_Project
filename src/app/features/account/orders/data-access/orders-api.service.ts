import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { mapHttpError } from '../../../../core/api/api-error.mapper';
import {
  CancelCustomerOrderRequest,
  CustomerOrder,
  CustomerOrderListQuery,
  CustomerOrderPageResponse,
  RebuyCustomerOrderResponse,
} from './orders.models';
import { ORDERS_ENDPOINTS } from './orders.endpoints';

interface WrappedResponse<T> {
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listOrders(query: CustomerOrderListQuery): Observable<CustomerOrderPageResponse> {
    let params = new HttpParams()
      .set('page', String(query.page))
      .set('size', String(query.size));

    if (query.status) {
      params = params.set('status', query.status);
    }

    const trimmedQuery = query.q?.trim();
    if (trimmedQuery) {
      params = params.set('q', trimmedQuery);
    }

    return this.http
      .get<CustomerOrderPageResponse | WrappedResponse<CustomerOrderPageResponse>>(
        `${this.baseUrl}${ORDERS_ENDPOINTS.base}`,
        { params }
      )
      .pipe(
        map((res) => this.unwrap<CustomerOrderPageResponse>(res)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  getOrderById(id: number): Observable<CustomerOrder> {
    return this.http
      .get<CustomerOrder | WrappedResponse<CustomerOrder>>(
        `${this.baseUrl}${ORDERS_ENDPOINTS.byId(id)}`
      )
      .pipe(
        map((res) => this.unwrap<CustomerOrder>(res)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  cancelOrder(id: number, payload: CancelCustomerOrderRequest): Observable<CustomerOrder> {
    return this.http
      .post<CustomerOrder | WrappedResponse<CustomerOrder>>(
        `${this.baseUrl}${ORDERS_ENDPOINTS.cancel(id)}`,
        payload
      )
      .pipe(
        map((res) => this.unwrap<CustomerOrder>(res)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  rebuyOrder(id: number): Observable<RebuyCustomerOrderResponse> {
    return this.http
      .post<RebuyCustomerOrderResponse | WrappedResponse<RebuyCustomerOrderResponse>>(
        `${this.baseUrl}${ORDERS_ENDPOINTS.rebuy(id)}`,
        {}
      )
      .pipe(
        map((res) => this.unwrap<RebuyCustomerOrderResponse>(res)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  private unwrap<T>(res: T | WrappedResponse<T>): T {
    if (res && typeof res === 'object' && 'data' in res && (res as WrappedResponse<T>).data !== undefined) {
      return (res as WrappedResponse<T>).data as T;
    }
    return res as T;
  }
}
