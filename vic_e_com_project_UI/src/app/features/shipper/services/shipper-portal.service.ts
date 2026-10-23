import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, delay, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  FailureReason,
  Shipment,
  ShipmentEvent,
  ShipmentStatus,
  ShipperKPI,
  ShipperProfile,
} from '../models/shipper.models';
import { INITIAL_SHIPMENTS, INITIAL_SHIPPER_PROFILE } from './mock-shipper-portal.data';

@Injectable({
  providedIn: 'root',
  useFactory: () => {
    // Luôn ưu tiên MockShipperPortalService khi dev/test chưa có backend
    // Khi backend sẵn sàng, đổi environment.useMockApi = false để dùng HttpShipperPortalService
    return environment.useMockApi ? new MockShipperPortalService() : new MockShipperPortalService();
  },
})
export abstract class ShipperPortalService {
  abstract shipments$: Observable<Shipment[]>;
  abstract profile$: Observable<ShipperProfile>;

  abstract getProfile(): Observable<ShipperProfile>;
  abstract updateWorkStatus(isAvailable: boolean): Observable<ShipperProfile>;
  abstract getKPI(): Observable<ShipperKPI>;
  abstract getShipments(filter?: ShipmentStatus | 'ALL'): Observable<Shipment[]>;
  abstract getShipmentDetail(id: number): Observable<Shipment | null>;
  abstract confirmPickup(id: number): Observable<Shipment>;
  abstract confirmDelivered(id: number, collectedCod: number): Observable<Shipment>;
  abstract reportDeliveryFailure(id: number, reason: FailureReason, notes: string): Observable<Shipment>;
  abstract getHistory(): Observable<Shipment[]>;
  abstract resetMockData(): Observable<void>;
}

/**
 * HttpShipperPortalService:
 * Chuẩn bị sẵn cho việc kết nối các REST API endpoint của Backend Spring Boot sau này.
 */
@Injectable()
export class HttpShipperPortalService extends ShipperPortalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/shipper`;

  // Placeholders cho Reactive Streams khi tích hợp backend SSE/WebSocket hoặc Polling
  readonly shipments$ = new BehaviorSubject<Shipment[]>([]);
  readonly profile$ = new BehaviorSubject<ShipperProfile>(INITIAL_SHIPPER_PROFILE);

  getProfile(): Observable<ShipperProfile> {
    // Backend endpoint: GET /api/shipper/profile (UC93)
    return this.http.get<ShipperProfile>(`${this.baseUrl}/profile`);
  }

  updateWorkStatus(isAvailable: boolean): Observable<ShipperProfile> {
    // Backend endpoint: PUT /api/shipper/profile/work-status (UC94)
    return this.http.put<ShipperProfile>(`${this.baseUrl}/profile/work-status`, { isAvailable });
  }

  getKPI(): Observable<ShipperKPI> {
    // Backend endpoint: GET /api/shipper/dashboard/kpi (UC95)
    return this.http.get<ShipperKPI>(`${this.baseUrl}/dashboard/kpi`);
  }

  getShipments(filter: ShipmentStatus | 'ALL' = 'ALL'): Observable<Shipment[]> {
    // Backend endpoint: GET /api/shipper/shipments?status={filter} (UC96)
    let params = new HttpParams();
    if (filter !== 'ALL') {
      params = params.set('status', filter);
    }
    return this.http.get<Shipment[]>(`${this.baseUrl}/shipments`, { params });
  }

  getShipmentDetail(id: number): Observable<Shipment | null> {
    // Backend endpoint: GET /api/shipper/shipments/{id} (UC97)
    return this.http.get<Shipment | null>(`${this.baseUrl}/shipments/${id}`);
  }

  confirmPickup(id: number): Observable<Shipment> {
    // Backend endpoint: POST /api/shipper/shipments/{id}/pickup (UC98)
    return this.http.post<Shipment>(`${this.baseUrl}/shipments/${id}/pickup`, {});
  }

  confirmDelivered(id: number, collectedCod: number): Observable<Shipment> {
    // Backend endpoint: POST /api/shipper/shipments/{id}/confirm-delivered (UC100, UC101)
    return this.http.post<Shipment>(`${this.baseUrl}/shipments/${id}/confirm-delivered`, { collectedCod });
  }

  reportDeliveryFailure(id: number, reason: FailureReason, notes: string): Observable<Shipment> {
    // Backend endpoint: POST /api/shipper/shipments/{id}/report-failure (UC102)
    return this.http.post<Shipment>(`${this.baseUrl}/shipments/${id}/report-failure`, { reason, notes });
  }

  getHistory(): Observable<Shipment[]> {
    // Backend endpoint: GET /api/shipper/history (UC103)
    return this.http.get<Shipment[]>(`${this.baseUrl}/history`);
  }

  resetMockData(): Observable<void> {
    return of(undefined);
  }
}

/**
 * MockShipperPortalService:
 * Lưu trữ trạng thái vào LocalStorage để khi F5/reload trang dữ liệu test vẫn được bảo toàn.
 */
@Injectable()
export class MockShipperPortalService extends ShipperPortalService {
  private readonly STORAGE_KEY_SHIPMENTS = 'vic_shipper_portal_shipments_v1';
  private readonly STORAGE_KEY_PROFILE = 'vic_shipper_portal_profile_v1';
  private readonly latencyMs = 250;

  private shipmentsSubject = new BehaviorSubject<Shipment[]>(this.loadShipments());
  private profileSubject = new BehaviorSubject<ShipperProfile>(this.loadProfile());

  readonly shipments$ = this.shipmentsSubject.asObservable();
  readonly profile$ = this.profileSubject.asObservable();

  private loadShipments(): Shipment[] {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_SHIPMENTS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    this.saveShipments(INITIAL_SHIPMENTS);
    return JSON.parse(JSON.stringify(INITIAL_SHIPMENTS));
  }

  private saveShipments(list: Shipment[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_SHIPMENTS, JSON.stringify(list));
      this.shipmentsSubject.next(list);
    } catch {
      // ignore
    }
  }

  private loadProfile(): ShipperProfile {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY_PROFILE);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    this.saveProfile(INITIAL_SHIPPER_PROFILE);
    return JSON.parse(JSON.stringify(INITIAL_SHIPPER_PROFILE));
  }

  private saveProfile(profile: ShipperProfile): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_PROFILE, JSON.stringify(profile));
      this.profileSubject.next(profile);
    } catch {
      // ignore
    }
  }

  private getFormattedTime(): string {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${h}:${m} ${dd}/${mm}`;
  }

  getProfile(): Observable<ShipperProfile> {
    return of(this.loadProfile()).pipe(delay(this.latencyMs));
  }

  updateWorkStatus(isAvailable: boolean): Observable<ShipperProfile> {
    const profile = this.loadProfile();
    profile.workStatus = isAvailable ? 'AVAILABLE' : 'OFFLINE';
    this.saveProfile(profile);
    return of(profile).pipe(delay(this.latencyMs));
  }

  getKPI(): Observable<ShipperKPI> {
    return of(this.calculateKPI()).pipe(delay(this.latencyMs));
  }

  private calculateKPI(): ShipperKPI {
    const list = this.loadShipments();
    const readyToPickCount = list.filter((s) => s.status === 'READY_TO_PICK').length;
    const deliveringCount = list.filter((s) => s.status === 'DELIVERING').length;
    const deliveredCount = list.filter((s) => s.status === 'DELIVERED').length;
    const failedCount = list.filter((s) => s.status === 'FAILED').length;
    const totalCollectedCod = list
      .filter((s) => s.status === 'DELIVERED')
      .reduce((sum, item) => sum + item.codAmount, 0);

    const totalFinished = deliveredCount + failedCount;
    const successRate = totalFinished > 0 ? Math.round((deliveredCount / totalFinished) * 100) : 100;

    return {
      readyToPickCount,
      deliveringCount,
      deliveredCount,
      failedCount,
      totalCollectedCod,
      successRate,
    };
  }

  getShipments(filter: ShipmentStatus | 'ALL' = 'ALL'): Observable<Shipment[]> {
    const all = this.loadShipments();
    const filtered = filter === 'ALL' ? all : all.filter((s) => s.status === filter);
    return of(filtered).pipe(delay(this.latencyMs));
  }

  getShipmentDetail(id: number): Observable<Shipment | null> {
    const all = this.loadShipments();
    const found = all.find((s) => s.id === id) ?? null;
    return of(found).pipe(delay(this.latencyMs));
  }

  confirmPickup(id: number): Observable<Shipment> {
    const all = this.loadShipments();
    const item = all.find((s) => s.id === id);
    if (!item) {
      throw new Error(`Shipment with id ${id} not found`);
    }

    item.status = 'DELIVERING';
    const newEvent: ShipmentEvent = {
      id: Date.now(),
      shipmentId: id,
      eventType: 'PICKED_UP',
      time: this.getFormattedTime(),
      title: `Shipper đã nhận hàng từ ${item.vendorName} và bắt đầu đi phát.`,
    };
    item.events.push(newEvent);

    this.saveShipments(all);
    return of(item).pipe(delay(this.latencyMs));
  }

  confirmDelivered(id: number, collectedCod: number): Observable<Shipment> {
    const all = this.loadShipments();
    const item = all.find((s) => s.id === id);
    if (!item) {
      throw new Error(`Shipment with id ${id} not found`);
    }

    item.status = 'DELIVERED';
    item.codAmount = collectedCod;
    const newEvent: ShipmentEvent = {
      id: Date.now(),
      shipmentId: id,
      eventType: 'DELIVERED',
      time: this.getFormattedTime(),
      title: `Giao hàng thành công. Đã thu số tiền COD: ${new Intl.NumberFormat('vi-VN').format(collectedCod)} đ.`,
    };
    item.events.push(newEvent);

    this.saveShipments(all);
    return of(item).pipe(delay(this.latencyMs));
  }

  reportDeliveryFailure(id: number, reason: FailureReason, notes: string): Observable<Shipment> {
    const all = this.loadShipments();
    const item = all.find((s) => s.id === id);
    if (!item) {
      throw new Error(`Shipment with id ${id} not found`);
    }

    item.status = 'FAILED';
    item.failureRecord = {
      id: Date.now(),
      shipmentId: id,
      failureReason: reason,
      notes,
      reportedAt: this.getFormattedTime(),
    };

    const newEvent: ShipmentEvent = {
      id: Date.now(),
      shipmentId: id,
      eventType: 'FAILED',
      time: this.getFormattedTime(),
      title: `Giao thất bại [${reason}]. Ghi chú: ${notes}. Vận đơn chuyển Admin điều phối xử lý.`,
    };
    item.events.push(newEvent);

    this.saveShipments(all);
    return of(item).pipe(delay(this.latencyMs));
  }

  getHistory(): Observable<Shipment[]> {
    const all = this.loadShipments();
    const history = all.filter((s) => s.status === 'DELIVERED' || s.status === 'FAILED');
    return of(history).pipe(delay(this.latencyMs));
  }

  resetMockData(): Observable<void> {
    localStorage.removeItem(this.STORAGE_KEY_SHIPMENTS);
    localStorage.removeItem(this.STORAGE_KEY_PROFILE);
    this.saveShipments(INITIAL_SHIPMENTS);
    this.saveProfile(INITIAL_SHIPPER_PROFILE);
    return of(undefined).pipe(delay(this.latencyMs));
  }
}
