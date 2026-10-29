import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProductVariant {
  sku: string;
  a: string; // Phân loại (vd: Nâu, 60cm, M)
  p: number; // Giá
  q: number; // Tồn kho
  l: number; // Ngưỡng cảnh báo
}

export interface SellerProduct {
  id: number;
  n: string; // Tên sản phẩm
  c: string; // Danh mục
  d: string; // Mô tả
  s: 'VISIBLE' | 'HIDDEN' | 'DRAFT' | 'DELETED'; // Trạng thái
  sold: number; // Đã bán
  imageUrl?: string;
  v: ProductVariant[]; // Biến thể
}

export interface ApiResponse<T> {
  code?: string;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class SellerProductService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/seller/products`;

  /**
   * API 1: Lấy danh sách sản phẩm
   * GET /api/seller/products
   */
  getProducts(status?: string, keyword?: string): Observable<SellerProduct[]> {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params['status'] = status;
    if (keyword && keyword.trim()) params['q'] = keyword.trim();

    return this.http.get<ApiResponse<SellerProduct[]>>(this.baseUrl, { params }).pipe(
      map((res) => res.data || []),
      catchError((err) => {
        console.warn('Lỗi khi tải sản phẩm từ backend API, sử dụng dữ liệu cục bộ:', err);
        return of([]);
      })
    );
  }

  /**
   * API 2: Thêm mới sản phẩm
   * POST /api/seller/products/create
   */
  createProduct(product: Partial<SellerProduct>): Observable<SellerProduct> {
    return this.http.post<ApiResponse<SellerProduct>>(`${this.baseUrl}/create`, product).pipe(
      map((res) => res.data)
    );
  }

  /**
   * API 3: Sửa sản phẩm
   * PUT /api/seller/products/{id}/update
   */
  updateProduct(id: number, product: Partial<SellerProduct>): Observable<SellerProduct> {
    return this.http.put<ApiResponse<SellerProduct>>(`${this.baseUrl}/${id}/update`, product).pipe(
      map((res) => res.data)
    );
  }

  /**
   * API 4: Xóa sản phẩm
   * DELETE /api/seller/products/{id}/delete
   */
  deleteProduct(id: number): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${id}/delete`).pipe(
      map(() => void 0)
    );
  }

  /**
   * API 5: Ẩn / Hiện sản phẩm
   * PATCH /api/seller/products/{id}/status
   */
  toggleProductStatus(id: number, status?: string): Observable<string> {
    return this.http.patch<ApiResponse<string>>(`${this.baseUrl}/${id}/status`, { status }).pipe(
      map((res) => res.data)
    );
  }

  /**
   * API 6: Cập nhật tồn kho sản phẩm
   * PATCH /api/seller/products/{id}/stock
   */
  updateStock(productId: number, payload: { sku?: string; q?: number; l?: number; variants?: ProductVariant[] }): Observable<any> {
    return this.http.patch<ApiResponse<any>>(`${this.baseUrl}/${productId}/stock`, payload).pipe(
      map((res) => res.data),
      catchError(() => {
        return this.updateProduct(productId, { v: payload.variants });
      })
    );
  }
}
