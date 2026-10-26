import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, map, of, tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { FailureReason, Shipment, ShipmentStatus, ShipperKPI, ShipperProfile, UpdateShipperProfileRequest } from '../models/shipper.models';

interface ApiResponse<T> { data: T; }

@Injectable({ providedIn: 'root' })
export class ShipperPortalService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/shipper`;
  private readonly shipmentsSubject = new BehaviorSubject<Shipment[]>([]);
  private readonly profileSubject = new BehaviorSubject<ShipperProfile | null>(null);
  readonly shipments$ = this.shipmentsSubject.asObservable() as Observable<Shipment[]>;
  readonly profile$ = this.profileSubject.asObservable() as Observable<ShipperProfile | null>;

  getProfile(): Observable<ShipperProfile> { 
    return this.http.get<ApiResponse<ShipperProfile>>(`${this.baseUrl}/profile`).pipe(map(r => r.data), tap(p => this.profileSubject.next(p))); 
  }

  updateProfile(data: UpdateShipperProfileRequest): Observable<ShipperProfile> {
    return this.http.put<ApiResponse<ShipperProfile>>(`${this.baseUrl}/profile`, data).pipe(
      map(r => r.data),
      tap(p => this.profileSubject.next(p))
    );
  }
  
  updateWorkStatus(isAvailable: boolean): Observable<ShipperProfile> {
    return this.http.put<ApiResponse<ShipperProfile>>(`${this.baseUrl}/profile/work-status`, { isAvailable }).pipe(map(r => r.data), tap(p => this.profileSubject.next(p)));
  }
  
  getKPI(): Observable<ShipperKPI> { 
    return this.http.get<ApiResponse<ShipperKPI>>(`${this.baseUrl}/dashboard/kpi`).pipe(map(r => r.data)); 
  }
  
  getShipments(filter: ShipmentStatus | 'ALL' = 'ALL'): Observable<Shipment[]> {
      let params = new HttpParams(); if (filter !== 'ALL') params = params.set('status', filter);
    return this.http.get<ApiResponse<Shipment[]>>(`${this.baseUrl}/shipments`, { params }).pipe(map(r => r.data), tap(s => this.shipmentsSubject.next(s)));
  }

  getShipmentDetail(id: number): Observable<Shipment | null> { 
    return this.http.get<ApiResponse<Shipment>>(`${this.baseUrl}/shipments/${id}`).pipe(map(r => r.data)); 
  }

  confirmPickup(id: number): Observable<Shipment> { 
    return this.http.post<ApiResponse<Shipment>>(`${this.baseUrl}/shipments/${id}/pickup`, {}).pipe(
      map(r => r.data),
      tap(() => this.refreshAfterMutation())
    ); 
  }
  
  confirmDelivered(id: number, collectedCod: number): Observable<Shipment> { 
    return this.http.post<ApiResponse<Shipment>>(`${this.baseUrl}/shipments/${id}/confirm-delivered`, { collectedCod }).pipe(
      map(r => r.data),
      tap(() => this.refreshAfterMutation())
    ); 
  }
  
  reportDeliveryFailure(id: number, reason: FailureReason, notes: string): Observable<Shipment> { 
    return this.http.post<ApiResponse<Shipment>>(`${this.baseUrl}/shipments/${id}/report-failure`, { reason, notes }).pipe(
      map(r => r.data),
      tap(() => this.refreshAfterMutation())
    ); 
  }

  private refreshAfterMutation(): void {
    this.getShipments().subscribe();
    this.getProfile().subscribe();
  }
  
  getHistory(): Observable<Shipment[]> { 
    return this.http.get<ApiResponse<Shipment[]>>(`${this.baseUrl}/history`).pipe(map(r => r.data)); 
  }
  
  resetMockData(): Observable<void> { 
    return of(undefined); 
  }
}
