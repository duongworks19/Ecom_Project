import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seller/orders`;

  getOrders(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  confirmOrder(code: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${encodeURIComponent(code)}/action`, { action: 'CONFIRM' });
  }

  updateOrderStatus(code: string, action: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${encodeURIComponent(code)}/action`, { action });
  }

  cancelOrder(code: string, reason: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${encodeURIComponent(code)}/action`, { action: 'CANCEL', reason });
  }
}
