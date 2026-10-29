import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  CategoryOverviewResponse,
  CategoryItem,
  ChangeStatusRequest,
  SlugCheckResponse,
  StatusChangeResponse,
  UpsertCategoryRequest,
  CategoryStatus,
} from '../models/admin-category.model';

interface BackendApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
}

const STORAGE_KEY = 'vic_admin_categories_cache';

@Injectable({
  providedIn: 'root',
})
export class AdminCategoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/categories`;

  constructor() {
    // Xóa bộ nhớ đệm cũ để đảm bảo không hiển thị danh mục mẫu có sẵn
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  private unwrap<T>() {
    return map((res: BackendApiResponse<T> | T) => {
      if (res && typeof res === 'object' && 'data' in res && (res as BackendApiResponse<T>).data !== undefined) {
        return (res as BackendApiResponse<T>).data;
      }
      return res as T;
    });
  }

  /**
   * 1. Lấy tổng quan cây danh mục từ cơ sở dữ liệu
   */
  getOverview(params: { keyword?: string; status?: CategoryStatus } = {}): Observable<CategoryOverviewResponse> {
    let httpParams = new HttpParams();
    if (params.keyword?.trim()) {
      httpParams = httpParams.set('keyword', params.keyword.trim());
    }
    if (params.status) {
      httpParams = httpParams.set('status', params.status);
    }

    return this.http
      .get<BackendApiResponse<CategoryOverviewResponse>>(this.baseUrl, { params: httpParams })
      .pipe(
        this.unwrap<CategoryOverviewResponse>(),
        catchError((err) => {
          console.error('[AdminCategoryService] Lỗi khi tải danh mục từ backend:', err);
          return of({
            summary: {
              totalCategories: 0,
              visibleCategories: 0,
              hiddenCategories: 0,
            },
            maxDepth: 3,
            items: [],
          });
        })
      );
  }

  /**
   * 2. Kiểm tra trùng Slug thời gian thực
   */
  checkSlug(slug: string, excludeId?: number | null): Observable<SlugCheckResponse> {
    const trimmed = slug.trim();
    let httpParams = new HttpParams().set('slug', trimmed);
    if (excludeId !== null && excludeId !== undefined) {
      httpParams = httpParams.set('excludeId', String(excludeId));
    }

    return this.http
      .get<BackendApiResponse<SlugCheckResponse>>(`${this.baseUrl}/check-slug`, { params: httpParams })
      .pipe(
        this.unwrap<SlugCheckResponse>(),
        catchError(() => {
          return of({
            slug: trimmed,
            available: true,
            suggestedSlug: null,
          });
        })
      );
  }

  /**
   * 3. Tạo mới danh mục và lưu vào cơ sở dữ liệu
   */
  createCategory(payload: UpsertCategoryRequest): Observable<CategoryItem> {
    return this.http
      .post<BackendApiResponse<CategoryItem>>(this.baseUrl, payload)
      .pipe(this.unwrap<CategoryItem>());
  }

  /**
   * 4. Cập nhật danh mục trong cơ sở dữ liệu
   */
  updateCategory(id: number, payload: UpsertCategoryRequest): Observable<CategoryItem> {
    return this.http
      .put<BackendApiResponse<CategoryItem>>(`${this.baseUrl}/${id}`, payload)
      .pipe(this.unwrap<CategoryItem>());
  }

  /**
   * 5. Đổi trạng thái (Ẩn / Hiện) danh mục
   */
  changeStatus(id: number, status: CategoryStatus): Observable<StatusChangeResponse> {
    const body: ChangeStatusRequest = { status };
    return this.http
      .patch<BackendApiResponse<StatusChangeResponse>>(`${this.baseUrl}/${id}/status`, body)
      .pipe(this.unwrap<StatusChangeResponse>());
  }

  /**
   * 6. Xóa danh mục trống
   */
  deleteCategory(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
