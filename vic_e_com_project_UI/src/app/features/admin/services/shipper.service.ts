import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, delay, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  CreateShipperRequest,
  PageResponse,
  ShipperDetail,
  ShipperDeliveryItem,
  ShipperListItem,
  ShipperQueryParams,
  ShipperSummary,
  UpdateShipperRequest,
} from '../models/shipper.models';
import { INITIAL_MOCK_SHIPPERS } from './mock-shipper.data';

@Injectable({
  providedIn: 'root',
  useFactory: () => (environment.useMockApi ? new MockShipperService() : new HttpShipperService()),
})
export abstract class ShipperService {
  abstract getShippers(params?: ShipperQueryParams): Observable<PageResponse<ShipperListItem>>;
  abstract getSummary(): Observable<ShipperSummary>;
  abstract getShipperDetail(id: number): Observable<ShipperDetail>;
  abstract getDeliveries(id: number, page?: number, size?: number): Observable<PageResponse<ShipperDeliveryItem>>;
  abstract createShipper(payload: CreateShipperRequest): Observable<ShipperDetail>;
  abstract updateShipper(id: number, payload: UpdateShipperRequest): Observable<ShipperDetail>;
  abstract lockShipper(id: number, reason?: string): Observable<ShipperDetail>;
  abstract unlockShipper(id: number): Observable<ShipperDetail>;
}

@Injectable()
export class HttpShipperService extends ShipperService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/admin/shippers`;

  getShippers(params: ShipperQueryParams = {}): Observable<PageResponse<ShipperListItem>> {
    let httpParams = new HttpParams();
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.status && params.status !== 'ALL') httpParams = httpParams.set('status', params.status);
    if (params.page !== undefined) httpParams = httpParams.set('page', String(params.page));
    if (params.size !== undefined) httpParams = httpParams.set('size', String(params.size));
    return this.http.get<PageResponse<ShipperListItem>>(this.baseUrl, { params: httpParams });
  }

  getSummary(): Observable<ShipperSummary> {
    return this.http.get<ShipperSummary>(`${this.baseUrl}/summary`);
  }

  getShipperDetail(id: number): Observable<ShipperDetail> {
    return this.http.get<ShipperDetail>(`${this.baseUrl}/${id}`);
  }

  getDeliveries(id: number, page = 0, size = 10): Observable<PageResponse<ShipperDeliveryItem>> {
    const params = new HttpParams().set('page', String(page)).set('size', String(size));
    return this.http.get<PageResponse<ShipperDeliveryItem>>(`${this.baseUrl}/${id}/deliveries`, { params });
  }

  createShipper(payload: CreateShipperRequest): Observable<ShipperDetail> {
    return this.http.post<ShipperDetail>(this.baseUrl, payload);
  }

  updateShipper(id: number, payload: UpdateShipperRequest): Observable<ShipperDetail> {
    return this.http.put<ShipperDetail>(`${this.baseUrl}/${id}`, payload);
  }

  lockShipper(id: number, reason?: string): Observable<ShipperDetail> {
    return this.http.post<ShipperDetail>(`${this.baseUrl}/${id}/lock`, { reason });
  }

  unlockShipper(id: number): Observable<ShipperDetail> {
    return this.http.post<ShipperDetail>(`${this.baseUrl}/${id}/unlock`, {});
  }
}

@Injectable()
export class MockShipperService extends ShipperService {
  private shippers: ShipperDetail[] = structuredClone(INITIAL_MOCK_SHIPPERS);
  private readonly latencyMs = 300;

  getShippers(params: ShipperQueryParams = {}): Observable<PageResponse<ShipperListItem>> {
    // ponytail: linear scan over in-memory mock array; ceiling is mock list size, upgrade path is backend indexed query
    const q = (params.keyword ?? '').trim().toLowerCase();
    const status = params.status ?? 'ALL';
    const filtered = this.shippers.filter((s) => {
      const matchStatus =
        status === 'ALL' ||
        (status === 'LOCKED' ? s.accountStatus === 'LOCKED' : s.accountStatus === 'ACTIVE' && s.workStatus === status);
      const matchKeyword =
        !q ||
        String(s.id).includes(q) ||
        s.fullName.toLowerCase().includes(q) ||
        s.phone.replace(/\s+/g, '').includes(q.replace(/\s+/g, ''));
      return matchStatus && matchKeyword;
    });
    const page = params.page ?? 0;
    const size = params.size ?? 20;
    const items = filtered.slice(page * size, (page + 1) * size);
    return of({ items: structuredClone(items), total: filtered.length, page, size }).pipe(delay(this.latencyMs));
  }

  getSummary(): Observable<ShipperSummary> {
    const active = this.shippers.filter((s) => s.accountStatus === 'ACTIVE');
    const summary: ShipperSummary = {
      total: this.shippers.length,
      available: active.filter((s) => s.workStatus === 'AVAILABLE').length,
      busy: active.filter((s) => s.workStatus === 'BUSY').length,
      locked: this.shippers.filter((s) => s.accountStatus === 'LOCKED').length,
      deliveringOrders: active.reduce((sum, s) => sum + s.deliveringCount, 0),
    };
    return of(summary).pipe(delay(this.latencyMs));
  }

  getShipperDetail(id: number): Observable<ShipperDetail> {
    const found = this.shippers.find((s) => s.id === id);
    return found ? of(structuredClone(found)).pipe(delay(this.latencyMs)) : this.notFound();
  }

  getDeliveries(id: number, page = 0, size = 10): Observable<PageResponse<ShipperDeliveryItem>> {
    const found = this.shippers.find((s) => s.id === id);
    if (!found) return this.notFound();
    const items = found.recentDeliveries.slice(page * size, (page + 1) * size);
    return of({ items: structuredClone(items), total: found.recentDeliveries.length, page, size }).pipe(
      delay(this.latencyMs)
    );
  }

  createShipper(payload: CreateShipperRequest): Observable<ShipperDetail> {
    const normPhone = payload.phone.replace(/\s+/g, '');
    const normEmail = payload.email.trim().toLowerCase();
    if (this.shippers.some((s) => s.email.toLowerCase() === normEmail)) {
      return throwError(
        () => new HttpErrorResponse({ status: 409, error: { field: 'email', message: 'Email đã được sử dụng' } })
      );
    }
    if (this.shippers.some((s) => s.phone.replace(/\s+/g, '') === normPhone)) {
      return throwError(
        () =>
          new HttpErrorResponse({ status: 409, error: { field: 'phone', message: 'Số điện thoại đã được sử dụng' } })
      );
    }
    const nextId = Math.max(0, ...this.shippers.map((s) => s.id)) + 1;
    const created: ShipperDetail = {
      id: nextId,
      fullName: payload.fullName.trim(),
      phone: normPhone,
      email: normEmail,
      workStatus: 'AVAILABLE',
      accountStatus: 'ACTIVE',
      deliveringCount: 0,
      serviceArea: payload.serviceArea.trim(),
      vehicleType: payload.vehicleType,
      licensePlate: payload.licensePlate.trim(),
      createdAt: '14/10/2026',
      performance: { deliveredCount: 0, failedCount: 0, successRate: 100 },
      recentDeliveries: [],
    };
    this.shippers.unshift(created);
    return of(structuredClone(created)).pipe(delay(this.latencyMs));
  }

  updateShipper(id: number, payload: UpdateShipperRequest): Observable<ShipperDetail> {
    const target = this.shippers.find((s) => s.id === id);
    if (!target) return this.notFound();
    const normPhone = payload.phone.replace(/\s+/g, '');
    if (this.shippers.some((s) => s.id !== id && s.phone.replace(/\s+/g, '') === normPhone)) {
      return throwError(
        () => new HttpErrorResponse({ status: 409, error: { field: 'phone', message: 'Số điện thoại đã được sử dụng' } })
      );
    }
    Object.assign(target, {
      fullName: payload.fullName.trim(),
      phone: normPhone,
      vehicleType: payload.vehicleType,
      licensePlate: payload.licensePlate.trim(),
      serviceArea: payload.serviceArea.trim(),
      workStatus: payload.workStatus,
    });
    return of(structuredClone(target)).pipe(delay(this.latencyMs));
  }

  lockShipper(id: number, reason?: string): Observable<ShipperDetail> {
    const target = this.shippers.find((s) => s.id === id);
    if (!target) return this.notFound();
    if (target.deliveringCount > 0) {
      return throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: {
              message: `Shipper đang giao ${target.deliveringCount} đơn hàng. Vui lòng đổi shipper cho các đơn này trước khi khóa tài khoản.`,
            },
          })
      );
    }
    Object.assign(target, { accountStatus: 'LOCKED', workStatus: 'OFFLINE', lockReason: reason?.trim() || undefined });
    return of(structuredClone(target)).pipe(delay(this.latencyMs));
  }

  unlockShipper(id: number): Observable<ShipperDetail> {
    const target = this.shippers.find((s) => s.id === id);
    if (!target) return this.notFound();
    Object.assign(target, { accountStatus: 'ACTIVE', workStatus: 'AVAILABLE', lockReason: undefined });
    return of(structuredClone(target)).pipe(delay(this.latencyMs));
  }

  private notFound<T>(): Observable<T> {
    return throwError(() => new HttpErrorResponse({ status: 404, error: { message: 'Không tìm thấy shipper' } }));
  }
}
