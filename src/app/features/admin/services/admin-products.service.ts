import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminProductItem {
  id: number;
  name: string;
  variant: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  soldCount: number;
  thumbnailColor: string;
  imageUrl: string;
  status: string;
  createdAt: string;
}

export interface AdminProductResponse {
  items: AdminProductItem[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
  summaryTotal: number;
  summaryActive: number;
  summaryLowStock: number;
}

@Injectable({ providedIn: 'root' })
export class AdminProductsService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/products`;

  getProducts(keyword?: string, category?: string, status?: string, page = 0, size = 10): Observable<{ data: AdminProductResponse }> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (keyword) params = params.set('keyword', keyword);
    if (category && category !== 'ALL') params = params.set('category', category);
    if (status && status !== 'ALL') params = params.set('status', status);

    return this.http.get<{ data: AdminProductResponse }>(this.API, { params });
  }

  toggleStatus(id: number): Observable<{ data: AdminProductItem }> {
    return this.http.patch<{ data: AdminProductItem }>(`${this.API}/${id}/status`, {});
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}
