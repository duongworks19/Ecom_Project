import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerVouchersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seller/vouchers`;

  getVouchers(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  createVoucher(payload: any): Observable<any> {
    return this.http.post<any>(this.baseUrl, payload);
  }

  updateVoucherStatus(id: number, status: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/${id}/status`, { status });
  }

  deleteVoucher(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/${id}`);
  }
}
