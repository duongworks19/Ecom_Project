import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import {
  ApiResponse,
  DispatchDetail,
  DispatchItem,
  DispatchPage,
  DispatchSummary,
  FailureResolutionRequest,
  ManualAssignRequest,
} from '../models/dispatch.models';

@Injectable({
  providedIn: 'root',
})
export class DispatchApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/dispatch`;

  getSummary(): Observable<DispatchSummary> {
    return this.http
      .get<ApiResponse<DispatchSummary>>(`${this.baseUrl}/summary`)
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  getItems(status?: string, page = 0, size = 50): Observable<DispatchPage<DispatchItem>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http
      .get<ApiResponse<DispatchPage<DispatchItem>>>(`${this.baseUrl}/items`, { params })
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  getDetail(orderId: number): Observable<DispatchDetail> {
    return this.http
      .get<ApiResponse<DispatchDetail>>(`${this.baseUrl}/items/${orderId}`)
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  resolveFailure(orderId: number, body: FailureResolutionRequest): Observable<DispatchDetail> {
    return this.http
      .post<ApiResponse<DispatchDetail>>(
        `${this.baseUrl}/items/${orderId}/failure-resolution`,
        body
      )
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  manualAssign(orderId: number, body: ManualAssignRequest): Observable<DispatchDetail> {
    return this.http
      .post<ApiResponse<DispatchDetail>>(
        `${this.baseUrl}/items/${orderId}/manual-assign`,
        body
      )
      .pipe(
        map((res) => res.data),
        catchError((err) => this.handleError(err))
      );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let userMessage = 'Hệ thống đang gặp sự cố, thử lại sau';

    if (error.status === 400) {
      userMessage = error.error?.message || 'Thông tin gửi lên không hợp lệ';
    } else if (error.status === 403) {
      userMessage = 'Bạn không có quyền thực hiện thao tác này';
    } else if (error.status === 404) {
      userMessage = 'Không tìm thấy vận đơn';
    } else if (error.status === 409) {
      userMessage = error.error?.message || 'Dữ liệu đã thay đổi bởi tác vụ khác, đang làm mới';
    } else if (error.status === 422) {
      userMessage = error.error?.message || 'Vi phạm điều kiện nghiệp vụ';
    } else if (error.status >= 500) {
      userMessage = 'Hệ thống đang gặp sự cố, thử lại sau';
    }

    return throwError(() => new Error(userMessage));
  }
}
