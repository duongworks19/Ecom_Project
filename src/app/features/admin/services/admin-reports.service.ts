import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminReportsData } from '../models/admin-reports.model';

@Injectable({
  providedIn: 'root',
})
export class AdminReportsService {
  private http = inject(HttpClient, { optional: true });
  private apiUrl = environment.apiUrl;

  private mockReportsData: AdminReportsData = {
    kpis: [
      {
        id: 'revenue',
        title: 'Doanh thu (triệu đ)',
        value: '97,0',
        subtext: '+9,5% so với 7 ngày trước',
        isDark: true,
      },
      {
        id: 'orders',
        title: 'Số đơn hàng',
        value: '158',
        subtext: '+6,0% so với 7 ngày trước',
      },
      {
        id: 'aov',
        title: 'Giá trị đơn trung bình (nghìn đ)',
        value: '614',
        subtext: 'Trên các đơn đã giao',
      },
      {
        id: 'cancel-rate',
        title: 'Tỷ lệ hủy đơn',
        value: '3,8%',
        subtext: '6 trên 158 đơn',
      },
    ],
    revenueTrend: [
      { date: '07/10', currentAmount: 12.4, previousAmount: 10.0 },
      { date: '08/10', currentAmount: 15.1, previousAmount: 12.2 },
      { date: '09/10', currentAmount: 9.6, previousAmount: 13.8 },
      { date: '10/10', currentAmount: 18.2, previousAmount: 15.2 },
      { date: '11/10', currentAmount: 14.0, previousAmount: 13.4 },
      { date: '12/10', currentAmount: 16.5, previousAmount: 14.1 },
      { date: '13/10', currentAmount: 11.2, previousAmount: 10.5, isCurrentDay: true },
    ],
    topProducts: [
      { rank: 1, name: 'Áo thun nam cổ tròn', soldCount: 214, percentage: 100 },
      { rank: 2, name: 'Quần jeans ống suông', soldCount: 168, percentage: 78.5 },
      { rank: 3, name: 'Tai nghe không dây', soldCount: 131, percentage: 61.2 },
      { rank: 4, name: 'Bình giữ nhiệt 500ml', soldCount: 96, percentage: 44.8 },
      { rank: 5, name: 'Ốp lưng điện thoại', soldCount: 88, percentage: 41.1 },
    ],
    topVendors: [
      { rank: 1, shopName: 'Shop Thời Trang', revenue: 31.4, sharePercent: 32.4 },
      { rank: 2, shopName: 'Shop Điện Tử', revenue: 24.8, sharePercent: 25.6 },
      { rank: 3, shopName: 'Shop Gia Dụng', revenue: 18.2, sharePercent: 18.8 },
      { rank: 4, shopName: 'Shop Phụ Kiện', revenue: 12.6, sharePercent: 13.0 },
    ],
    exportItems: [
      {
        id: 'exp-1',
        title: 'Báo cáo doanh thu',
        description: 'Theo ngày, tuần hoặc tháng, kèm hoa hồng sàn.',
        formats: ['Excel', 'PDF'],
      },
      {
        id: 'exp-2',
        title: 'Danh sách đơn hàng',
        description: 'Lọc theo trạng thái, vendor và khoảng thời gian.',
        formats: ['Excel', 'CSV'],
      },
      {
        id: 'exp-3',
        title: 'Sản phẩm bán chạy và tồn kho thấp',
        description: 'Số lượng đã bán và các biến thể sắp hết hàng.',
        formats: ['Excel'],
      },
      {
        id: 'exp-4',
        title: 'Đối soát COD và hoàn tiền',
        description: 'Tiền shipper đã thu, đơn hoàn và khoản chờ đối soát.',
        formats: ['Excel', 'PDF'],
      },
      {
        id: 'exp-5',
        title: 'Hiệu quả khuyến mãi',
        description: 'Lượt dùng voucher và tổng tiền đã giảm theo chiến dịch.',
        formats: ['Excel'],
      },
    ],
  };

  /**
   * Lấy toàn bộ số liệu Báo cáo & Xuất dữ liệu từ Database Backend
   */
  getReportsData(period: string = '7days'): Observable<AdminReportsData> {
    if (this.http) {
      return this.http
        .get<AdminReportsData>(`${this.apiUrl}/admin/reports/overview`, { params: { period } })
        .pipe(
          catchError(() => of(this.mockReportsData))
        );
    }
    return of(this.mockReportsData);
  }
}
