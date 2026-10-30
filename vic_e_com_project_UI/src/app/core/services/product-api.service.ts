import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { CategoryItem, PublicCategoryResponse } from '../models/category.model';

@Injectable({
  providedIn: 'root',
})
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl;

  /**
   * Lấy danh sách danh mục từ API:
   * URL: http://localhost:4200/api/categories.json (hoặc ${baseUrl}/categories khi có BE riêng)
   */
  getCategories(): Observable<CategoryItem[] | null> {
    const url = this.baseUrl.startsWith('http')
      ? `${this.baseUrl}/categories`
      : `${this.baseUrl}/categories.json`;

    return this.http.get<any>(url).pipe(
      map((response) => {
        if (Array.isArray(response?.data?.items)) return response.data.items;
        if (Array.isArray(response?.data)) return response.data;
        if (Array.isArray(response?.items)) return response.items;
        if (Array.isArray(response)) return response;
        return [];
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Lấy danh sách sản phẩm từ API:
   * URL: http://localhost:4200/api/products.json (hoặc ${baseUrl}/products khi có BE riêng)
   */
  getProducts(filter?: { category?: string; search?: string }): Observable<Product[] | null> {
    const isExternalApi = this.baseUrl.startsWith('http');
    const url = isExternalApi
      ? `${this.baseUrl}/products`
      : `${this.baseUrl}/products.json`;

    let params = new HttpParams();
    if (isExternalApi) {
      if (filter?.category && filter.category !== 'all') {
        params = params.set('category', filter.category);
      }
      if (filter?.search) {
        params = params.set('search', filter.search);
      }
    }

    const applyFilter = (products: Product[] | null) => {
      if (!products) return null;
      let list = products;
      if (filter?.category && filter.category !== 'all') {
        list = list.filter((p) => p.category === filter.category);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.categoryLabel.toLowerCase().includes(q) ||
            p.seller.name.toLowerCase().includes(q)
        );
      }
      return list;
    };

    return this.http.get<Product[]>(url, { params }).pipe(
      map((products) => (isExternalApi ? products : applyFilter(products))),
      catchError(() =>
        isExternalApi
          ? this.http.get<Product[]>('/api/products.json').pipe(
              map(applyFilter),
              catchError(() => of(null))
            )
          : of(null)
      )
    );
  }

  /**
   * Lấy chi tiết một sản phẩm: GET /api/products/:id
   */
  getProductById(id: string): Observable<Product | null> {
    const isExternalApi = this.baseUrl.startsWith('http');
    const url = isExternalApi
      ? `${this.baseUrl}/products/${id}`
      : `${this.baseUrl}/products.json`;

    return this.http.get<any>(url).pipe(
      map((res) => {
        if (Array.isArray(res)) {
          return res.find((p) => p.id === id) || null;
        }
        return res;
      }),
      catchError(() => of(null))
    );
  }
}
