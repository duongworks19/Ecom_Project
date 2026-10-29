import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminReportsData, ExportReportItem } from '../models/admin-reports.model';
interface ApiResponse<T> { data: T; }
interface Overview { kpis: Array<{id:string; title:string; value:number; changePercent:number|null; note:string}>; revenueTrend: Array<{date:string; currentAmount:number; previousAmount:number}>; topProducts: AdminReportsData['topProducts']; topVendors: AdminReportsData['topVendors']; }
const exportItems: ExportReportItem[] = [
  { id: 'revenue', title: 'Báo cáo doanh thu', description: 'Theo ngày, tuần hoặc tháng.', formats: ['CSV'] },
  { id: 'orders', title: 'Danh sách đơn hàng', description: 'Lọc theo trạng thái, vendor và khoảng thời gian.', formats: ['CSV'] },
  { id: 'products', title: 'Sản phẩm bán chạy và tồn kho thấp', description: 'Số lượng đã bán và các biến thể sắp hết hàng.', formats: ['CSV'] },
  { id: 'cod', title: 'Đối soát COD và hoàn tiền', description: 'Tiền shipper đã thu, đơn hoàn và khoản chờ đối soát.', formats: ['CSV'] },
  { id: 'vouchers', title: 'Hiệu quả khuyến mãi', description: 'Lượt dùng voucher và tổng tiền đã giảm.', formats: ['CSV'] },
];
@Injectable({ providedIn: 'root' })
export class AdminReportsService {
  private http = inject(HttpClient); private apiUrl = `${environment.apiUrl}/admin/reports`;
  getReportsData(period = '7days', vendorId?: number): Observable<AdminReportsData> {
    const params = new HttpParams().set('period', period);
    const requestParams = vendorId == null ? params : params.set('vendorId', vendorId);
    return this.http.get<ApiResponse<Overview>>(`${this.apiUrl}/overview`, { params: requestParams }).pipe(map(({ data }) => ({
      kpis: data.kpis.map(k => ({ id:k.id, title:k.title, value:this.formatValue(k.value,k.id), subtext:this.subtext(k), isDark:k.id==='revenue' })),
      revenueTrend: data.revenueTrend.map(p => ({ ...p, date:new Date(p.date).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit'}) })), topProducts:data.topProducts, topVendors:data.topVendors, exportItems
    })));
  }
  getFilters(): Observable<{ vendors: { id:number; name:string }[]; categories: { id:number; name:string }[] }> {
    return this.http.get<ApiResponse<{ vendors: {id:number;name:string}[]; categories:{id:number;name:string}[] }>>(`${this.apiUrl}/filters`).pipe(map(r => r.data));
  }
  download(reportId: string, period = '7days'): Observable<Blob> { return this.http.get(`${this.apiUrl}/export/${reportId}`, { params:new HttpParams().set('period',period), responseType:'blob' }); }
  private formatValue(value:number,id:string):string { return id==='cancel-rate' ? `${value.toFixed(1)}%` : new Intl.NumberFormat('vi-VN').format(value); }
  private subtext(k:Overview['kpis'][number]):string { return k.changePercent==null ? k.note : `${k.changePercent>=0?'+':''}${k.changePercent.toFixed(1)}% so với kỳ trước`; }
}
