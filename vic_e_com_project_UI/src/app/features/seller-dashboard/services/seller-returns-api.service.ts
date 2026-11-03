import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerReturnsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seller/returns`;

  getReturns(): Observable<any> {
    return this.http.get<any>(this.baseUrl);
  }

  approveReturn(id: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/approve`, {});
  }

  rejectReturn(id: number, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/${id}/reject`, { reason });
  }
}
