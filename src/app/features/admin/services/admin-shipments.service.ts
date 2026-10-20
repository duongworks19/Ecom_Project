import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AdminOrderItem } from './admin-orders.service';

export interface AdminShipperItem {
  id: number;
  fullName: string;
  phone: string;
  workStatus: string;
  accountStatus: string;
  deliveringCount: number;
}

export interface AdminShipmentData {
  orders: AdminOrderItem[];
  shippers: AdminShipperItem[];
  awaitingShipperCount: number;
  shippingCount: number;
  totalShippers: number;
}

@Injectable({ providedIn: 'root' })
export class AdminShipmentsService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/shipments`;

  getShipments(): Observable<{ data: AdminShipmentData }> {
    return this.http.get<{ data: AdminShipmentData }>(this.API);
  }

  assignShipper(orderId: number, shipperId: number): Observable<{ data: AdminOrderItem }> {
    return this.http.post<{ data: AdminOrderItem }>(`${this.API}/assign`, { orderId, shipperId });
  }
}
