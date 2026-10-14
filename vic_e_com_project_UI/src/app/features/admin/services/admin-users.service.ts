import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AdminCustomer,
  AdminUsersOverview,
  CustomerStatus,
  CustomerStatusChangePayload,
} from '../models/admin-users.model';

@Injectable({
  providedIn: 'root',
})
export class AdminUsersService {
  private http = inject(HttpClient, { optional: true });
  private apiUrl = environment.apiUrl;

  private mockCustomers: AdminCustomer[] = [
    {
      id: 1,
      code: 'CUS-001',
      fullName: 'Nguyễn Minh Anh',
      initial: 'N',
      email: 'minhanh.nguyen@gmail.com',
      phone: '0901 *** 218',
      status: 'ACTIVE',
      createdAt: '14/09/2026',
      addresses: [
        { id: 101, label: 'Nhà riêng', addressDetail: 'Số 45, Cầu Giấy, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 14, cancelledOrders: 0, totalSpent: '7,2 triệu đ', lastOrderDate: '12/10/2026' },
    },
    {
      id: 2,
      code: 'CUS-002',
      fullName: 'Trần Quốc Bảo',
      initial: 'T',
      email: 'bao.tran@gmail.com',
      phone: '0988 *** 654',
      status: 'ACTIVE',
      createdAt: '03/09/2026',
      addresses: [
        { id: 102, label: 'Văn phòng', addressDetail: 'Tầng 8, Tòa Keangnam, Nam Từ Liêm, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 6, cancelledOrders: 1, totalSpent: '3,1 triệu đ', lastOrderDate: '05/10/2026' },
    },
    {
      id: 3,
      code: 'CUS-003',
      fullName: 'Lê Hoài Nam',
      initial: 'L',
      email: 'hoainam.le@gmail.com',
      phone: '0913 *** 890',
      status: 'ACTIVE',
      createdAt: '28/08/2026',
      addresses: [
        { id: 103, label: 'Nhà riêng', addressDetail: 'Số 102, Phố Huế, Hai Bà Trưng, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 21, cancelledOrders: 1, totalSpent: '12,5 triệu đ', lastOrderDate: '13/10/2026' },
    },
    {
      id: 4,
      code: 'CUS-004',
      fullName: 'Phạm Thu Trang',
      initial: 'P',
      email: 'thutrang.pham@gmail.com',
      phone: '0977 *** 112',
      status: 'ACTIVE',
      createdAt: '21/08/2026',
      addresses: [
        { id: 104, label: 'Nhà riêng', addressDetail: 'Số 19, Hoàng Hoa Thám, Ba Đình, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 8, cancelledOrders: 0, totalSpent: '2,9 triệu đ', lastOrderDate: '01/10/2026' },
    },
    {
      id: 5,
      code: 'CUS-005',
      fullName: 'Hoàng Bảo Ngọc',
      initial: 'H',
      email: 'baongoc.hoang@gmail.com',
      phone: '0934 *** 776',
      status: 'ACTIVE',
      createdAt: '12/08/2026',
      addresses: [
        { id: 105, label: 'Nhà riêng', addressDetail: 'Khu đô thị Times City, Minh Khai, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 11, cancelledOrders: 2, totalSpent: '5,4 triệu đ', lastOrderDate: '10/10/2026' },
    },
    {
      id: 6,
      code: 'CUS-006',
      fullName: 'Đỗ Khánh Linh',
      initial: 'Đ',
      email: 'khanhlinh.do@gmail.com',
      phone: '0912 *** 345',
      status: 'LOCKED',
      createdAt: '02/09/2026',
      addresses: [
        { id: 106, label: 'Nhà riêng', addressDetail: 'Số 12, ngõ 25, Lê Văn Lương, Thanh Xuân, Hà Nội', isDefault: true },
        { id: 107, label: 'Cơ quan', addressDetail: 'Số 8, Nguyễn Trãi, Hà Đông, Hà Nội', isDefault: false },
      ],
      purchaseStats: { totalOrders: 9, cancelledOrders: 2, totalSpent: '4,8 triệu đ', lastOrderDate: '09/10/2026' },
    },
    {
      id: 7,
      code: 'CUS-007',
      fullName: 'Vũ Đức Minh',
      initial: 'V',
      email: 'ducminh.vu@gmail.com',
      phone: '0965 *** 432',
      status: 'ACTIVE',
      createdAt: '30/07/2026',
      addresses: [
        { id: 108, label: 'Nhà riêng', addressDetail: 'Số 88, Láng Hạ, Đống Đa, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 5, cancelledOrders: 0, totalSpent: '1,8 triệu đ', lastOrderDate: '28/09/2026' },
    },
    {
      id: 8,
      code: 'CUS-008',
      fullName: 'Bùi Ngọc Mai',
      initial: 'B',
      email: 'ngocmai.bui@gmail.com',
      phone: '0942 *** 991',
      status: 'ACTIVE',
      createdAt: '18/07/2026',
      addresses: [
        { id: 109, label: 'Nhà riêng', addressDetail: 'Số 3, Xuân Thủy, Cầu Giấy, Hà Nội', isDefault: true },
      ],
      purchaseStats: { totalOrders: 15, cancelledOrders: 1, totalSpent: '6,3 triệu đ', lastOrderDate: '11/10/2026' },
    },
  ];

  private totalCount = 96;
  private lockedCount = 5;

  /**
   * UC22 & UC23: Lấy danh sách Customer kèm KPI thống kê
   * API quy ước: GET /api/v1/admin/customers?keyword=...&status=...&page=0&size=8
   */
  getCustomersOverview(keyword: string = '', status: string = 'ALL'): Observable<AdminUsersOverview> {
    /*
     * Endpoint Backend thực tế:
     * return this.http.get<AdminUsersOverview>(`${this.apiUrl}/v1/admin/customers`, {
     *   params: { keyword, status }
     * });
     */
    // ponytail: client-side filter over in-memory mock array; ceiling is mock dataset size, upgrade path is backend pagination query
    const q = keyword.trim().toLowerCase();
    const filtered = this.mockCustomers.filter((c) => {
      const matchStatus = status === 'ALL' || c.status === status;
      const matchKeyword =
        !q ||
        c.fullName.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        String(c.id).includes(q);
      return matchStatus && matchKeyword;
    });

    const activeCount = this.totalCount - this.lockedCount;
    return of({
      totalCount: this.totalCount,
      kpis: [
        { id: 'total', title: 'Tổng Customer', value: this.totalCount, subtext: '+3 trong 7 ngày', isDark: true, subtextHighlight: true },
        { id: 'active', title: 'Đang hoạt động', value: activeCount, subtext: 'Có thể đăng nhập bình thường' },
        { id: 'locked', title: 'Đã khóa', value: this.lockedCount, subtext: 'Không thể đăng nhập' },
      ],
      customers: filtered,
    });
  }

  /**
   * UC27 & UC28: Khóa hoặc mở khóa tài khoản Customer (kèm lý do lưu vào account_lock_logs)
   * API quy ước: PATCH /api/v1/admin/customers/{id}/status
   */
  changeCustomerStatus(payload: CustomerStatusChangePayload): Observable<AdminCustomer | undefined> {
    /*
     * Endpoint Backend thực tế:
     * return this.http.patch<AdminCustomer>(`${this.apiUrl}/v1/admin/customers/${payload.customerId}/status`, {
     *   action: payload.action,
     *   reason: payload.reason
     * });
     */
    const target = this.mockCustomers.find((c) => c.id === payload.customerId);
    if (target) {
      const nextStatus: CustomerStatus = payload.action === 'LOCK' ? 'LOCKED' : 'ACTIVE';
      if (target.status !== nextStatus) {
        target.status = nextStatus;
        this.lockedCount += nextStatus === 'LOCKED' ? 1 : -1;
      }
    }
    return of(target);
  }
}
