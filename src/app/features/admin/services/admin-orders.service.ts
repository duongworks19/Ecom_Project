import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminOrderItem {
  id: number;
  orderCode: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  createdAtLabel: string;
  productSummary: string;
  productImage: string;
  totalAmount: number;
  status: string;
  statusLabel: string;
  badgeClass: string;
  actionText: string;
  actionStyle: string;
  nextAction: string;
}

export interface AdminOrderResponse {
  items: AdminOrderItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  summaryTotal: number;
  summaryPending: number;
  summaryPreparing: number;
  summaryShipping: number;
  summaryDelivered: number;
}

@Injectable({ providedIn: 'root' })
export class AdminOrdersService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/orders`;

  getOrders(keyword?: string, status?: string, page = 0, size = 10): Observable<{ data: AdminOrderResponse }> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword) params = params.set('keyword', keyword);
    if (status && status !== 'ALL') params = params.set('status', status);

    return this.http.get<{ data: AdminOrderResponse }>(this.API, { params });
  }

  updateOrderStatus(id: number, status: string): Observable<{ data: AdminOrderItem }> {
    return this.http.patch<{ data: AdminOrderItem }>(`${this.API}/${id}/status`, { status });
  }
}
