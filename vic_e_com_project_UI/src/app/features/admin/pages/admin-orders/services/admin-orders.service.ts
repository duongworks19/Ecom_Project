import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { ApiResponse } from '../../../../../shared/models/api-response.model';
import {
  AdminOrderDetail,
  AdminOrderFilter,
  AdminOrderItem,
  AdminOrderPage,
  AdminOrderSummary,
  ShopOption,
} from '../models/admin-orders.model';

export function buildOrderHttpParams(filter: AdminOrderFilter): HttpParams {
  let params = new HttpParams();

  if (filter.q && filter.q.trim()) {
    params = params.set('q', filter.q.trim());
  }
  if (filter.status && filter.status !== 'ALL') {
    params = params.set('status', filter.status);
  }
  if (filter.shopId && filter.shopId > 0) {
    params = params.set('shopId', filter.shopId.toString());
  }
  if (filter.paymentMethod && filter.paymentMethod !== 'ALL') {
    params = params.set('paymentMethod', filter.paymentMethod);
  }
  if (filter.from) {
    params = params.set('from', filter.from);
  }
  if (filter.to) {
    params = params.set('to', filter.to);
  }

  const page = filter.page && filter.page >= 1 ? filter.page : 1;
  const pageSize = filter.pageSize && filter.pageSize >= 1 ? filter.pageSize : 20;

  params = params.set('page', page.toString());
  params = params.set('pageSize', pageSize.toString());

  return params;
}

@Injectable({
  providedIn: 'root',
})
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/orders`;
  private readonly shopsUrl = `${environment.apiUrl}/shops`;

  getSummary(): Observable<AdminOrderSummary> {
    return this.http
      .get<ApiResponse<AdminOrderSummary>>(`${this.baseUrl}/summary`)
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  getOrders(filter: AdminOrderFilter): Observable<AdminOrderPage<AdminOrderItem>> {
    const params = buildOrderHttpParams(filter);
    return this.http
      .get<ApiResponse<AdminOrderPage<AdminOrderItem>>>(this.baseUrl, { params })
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  getOrderDetail(id: number): Observable<AdminOrderDetail> {
    return this.http
      .get<ApiResponse<AdminOrderDetail>>(`${this.baseUrl}/${id}`)
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  // ponytail: Reusing /api/shops to populate shop filter list.
  getShops(): Observable<ShopOption[]> {
    return this.http
      .get<ApiResponse<Array<{ id: number; name: string }>>>(this.shopsUrl)
      .pipe(
        map((res) => (res.data || []).map((s) => ({ id: s.id, name: s.name }))),
        catchError(() => throwError(() => new Error('Không thể tải danh sách cửa hàng')))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';

    if (error.status === 400) {
      userMessage = error.error?.message || 'Thông tin tìm kiếm hoặc lọc không hợp lệ';
    } else if (error.status === 403) {
      userMessage = 'Bạn không có quyền thực hiện thao tác này';
    } else if (error.status === 404) {
      userMessage = 'Không tìm thấy thông tin đơn hàng';
    } else if (error.status >= 500) {
      userMessage = 'Hệ thống đang gặp sự cố, vui lòng thử lại sau';
    }

    return throwError(() => new Error(userMessage));
  }
}

