import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminVoucherItem {
  id: number;
  code: string;
  title: string;
  discountText: string;
  minOrderAmount: number;
  usedCount: number;
  totalQuota: number;
  expiryDate: string;
  active: boolean;
  createdAt: string;
}

export interface AdminVoucherResponse {
  items: AdminVoucherItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  summaryTotal: number;
  summaryActive: number;
}

@Injectable({ providedIn: 'root' })
export class AdminVouchersService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/vouchers`;

  getVouchers(keyword?: string, status?: string, page = 0, size = 10): Observable<{ data: AdminVoucherResponse }> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword) params = params.set('keyword', keyword);
    if (status && status !== 'ALL') params = params.set('status', status);

    return this.http.get<{ data: AdminVoucherResponse }>(this.API, { params });
  }

  createVoucher(payload: Partial<AdminVoucherItem>): Observable<{ data: AdminVoucherItem }> {
    return this.http.post<{ data: AdminVoucherItem }>(this.API, payload);
  }

  toggleVoucher(id: number): Observable<{ data: AdminVoucherItem }> {
    return this.http.patch<{ data: AdminVoucherItem }>(`${this.API}/${id}/toggle`, {});
  }

  deleteVoucher(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}
