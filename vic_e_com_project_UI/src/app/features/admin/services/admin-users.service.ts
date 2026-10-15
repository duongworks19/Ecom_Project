import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {
  AdminCustomer,
  AdminUsersOverview,
  CustomerDetailApiResponse,
  CustomerKpiCard,
  CustomerListItemApiResponse,
  CustomerOrderItemApiResponse,
  CustomerPageApiResponse,
  CustomerReviewItemApiResponse,
  CustomerStatusApiResponse,
  CustomerStatusChangePayload,
  CustomerSummaryApiResponse,
} from '../models/admin-users.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/customers`;

  /**
   * UC22 & UC23: Lấy danh sách Customer kèm KPI thống kê từ Backend
   */
  getCustomersOverview(
    keyword: string = '',
    status: string = 'ALL',
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt',
    dir: string = 'desc'
  ): Observable<AdminUsersOverview> {
    return forkJoin({
      summary: this.getCustomerSummary(),
      pageData: this.getCustomersPage(keyword, status, page, size, sort, dir),
    }).pipe(
      map(({ summary, pageData }) => ({
        kpis: this.mapSummaryToKpis(summary),
        totalCount: pageData.totalElements,
        page: pageData.page,
        size: pageData.size,
        totalPages: pageData.totalPages,
        customers: (pageData.items ?? []).map((item) => this.mapListItem(item)),
      }))
    );
  }

  getCustomersPage(
    keyword: string = '',
    status: string = 'ALL',
    page: number = 0,
    size: number = 10,
    sort: string = 'createdAt',
    dir: string = 'desc'
  ): Observable<CustomerPageApiResponse<CustomerListItemApiResponse>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('sort', sort)
      .set('dir', dir);

    const trimmed = keyword.trim();
    if (trimmed) {
      params = params.set('keyword', trimmed);
    }
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<CustomerPageApiResponse<CustomerListItemApiResponse>>(this.baseUrl, {
      params,
    });
  }

  getCustomerSummary(): Observable<CustomerSummaryApiResponse> {
    return this.http.get<CustomerSummaryApiResponse>(`${this.baseUrl}/summary`);
  }

  /**
   * UC24: Lấy hồ sơ chi tiết Customer (địa chỉ giao hàng + thống kê mua hàng)
   */
  getCustomerDetail(customerId: number): Observable<AdminCustomer> {
    return this.http
      .get<CustomerDetailApiResponse>(`${this.baseUrl}/${customerId}`)
      .pipe(map((res) => this.mapDetail(res)));
  }

  /**
   * UC25: Lấy danh sách đơn hàng của Customer
   */
  getCustomerOrders(
    customerId: number,
    page: number = 0,
    size: number = 10
  ): Observable<CustomerPageApiResponse<CustomerOrderItemApiResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<CustomerPageApiResponse<CustomerOrderItemApiResponse>>(
      `${this.baseUrl}/${customerId}/orders`,
      { params }
    );
  }

  /**
   * UC26: Lấy danh sách đánh giá sản phẩm của Customer
   */
  getCustomerReviews(
    customerId: number,
    page: number = 0,
    size: number = 10
  ): Observable<CustomerPageApiResponse<CustomerReviewItemApiResponse>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<CustomerPageApiResponse<CustomerReviewItemApiResponse>>(
      `${this.baseUrl}/${customerId}/reviews`,
      { params }
    );
  }

  /**
   * UC27 & UC28: Khóa hoặc mở khóa tài khoản Customer
   */
  changeCustomerStatus(payload: CustomerStatusChangePayload): Observable<CustomerStatusApiResponse> {
    const endpoint = payload.action === 'LOCK' ? 'lock' : 'unlock';
    return this.http.post<CustomerStatusApiResponse>(
      `${this.baseUrl}/${payload.customerId}/${endpoint}`,
      { reason: payload.reason }
    );
  }

  private mapSummaryToKpis(summary: CustomerSummaryApiResponse): CustomerKpiCard[] {
    return [
      {
        id: 'total',
        title: 'Tổng Customer',
        value: summary?.total ?? 0,
        subtext: `+${summary?.newLast7Days ?? 0} trong 7 ngày`,
        isDark: true,
        subtextHighlight: true,
      },
      {
        id: 'active',
        title: 'Đang hoạt động',
        value: summary?.active ?? 0,
        subtext: 'Có thể đăng nhập bình thường',
      },
      {
        id: 'locked',
        title: 'Đã khóa',
        value: summary?.locked ?? 0,
        subtext: 'Không thể đăng nhập',
      },
    ];
  }

  private mapListItem(item: CustomerListItemApiResponse): AdminCustomer {
    const fullName = item.fullName || 'Khách hàng';
    return {
      id: item.id,
      code: `CUS-${String(item.id).padStart(3, '0')}`,
      fullName,
      initial: fullName.trim().charAt(0).toUpperCase() || 'C',
      avatarUrl: item.avatarUrl,
      email: item.email ?? '—',
      phone: item.phone ?? '—',
      status: item.status,
      createdAt: this.formatDate(item.createdAt),
      addresses: [],
      purchaseStats: {
        totalOrders: 0,
        cancelledOrders: 0,
        totalSpent: '0 đ',
        lastOrderDate: 'Chưa có đơn',
      },
    };
  }

  private mapDetail(res: CustomerDetailApiResponse): AdminCustomer {
    const base = this.mapListItem(res.profile);
    const stats = res.purchaseSummary;
    return {
      ...base,
      addresses: (res.addresses ?? []).map((addr) => ({
        id: addr.id,
        label: addr.phone ? `${addr.receiverName} (${addr.phone})` : addr.receiverName,
        addressDetail: addr.addressDetail,
        isDefault: addr.isDefault,
      })),
      purchaseStats: {
        totalOrders: stats?.totalOrders ?? 0,
        cancelledOrders: stats?.cancelledOrders ?? 0,
        totalSpent: this.formatCurrency(stats?.totalSpent ?? 0),
        lastOrderDate: stats?.lastOrderAt ? this.formatDate(stats.lastOrderAt) : 'Chưa có đơn',
      },
    };
  }

  private formatDate(isoDateTime: string | null | undefined): string {
    if (!isoDateTime) return '—';
    const d = new Date(isoDateTime);
    if (Number.isNaN(d.getTime())) return isoDateTime;
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  }

  private formatCurrency(amount: number): string {
    const num = Number(amount) || 0;
    return `${num.toLocaleString('vi-VN')} đ`;
  }
}

