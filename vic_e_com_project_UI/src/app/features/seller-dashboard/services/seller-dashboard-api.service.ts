import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerDashboardApiService {
  private readonly http = inject(HttpClient);

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/seller/dashboard`);
  }

  getInventory(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/seller/inventory`);
  }

  getCategoryTree(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/categories/tree`);
  }

  getCategories(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/categories`);
  }
}
