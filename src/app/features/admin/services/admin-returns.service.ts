import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminOrderItem } from './admin-orders.service';

export interface AdminReturnResponse {
  items: AdminOrderItem[];
  total: number;
  summaryPending: number;
  summaryCompleted: number;
}

@Injectable({ providedIn: 'root' })
export class AdminReturnsService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/returns`;

  getReturns(): Observable<{ data: AdminReturnResponse }> {
    return this.http.get<{ data: AdminReturnResponse }>(this.API);
  }

  reviewReturn(id: number, action: 'APPROVE' | 'REJECT', note?: string): Observable<{ data: AdminOrderItem }> {
    return this.http.post<{ data: AdminOrderItem }>(`${this.API}/${id}/review`, { action, note });
  }
}
