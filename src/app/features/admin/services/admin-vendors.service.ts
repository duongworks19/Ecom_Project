import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminVendorListItem {
  id: number;
  userId: number;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  businessName: string;
  shopName: string;
  shopLogo?: string;
  shopPickupAddress: string;
  kycDocumentUrl?: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectReason?: string;
  createdAt: string;
}

export interface AdminVendorSummary {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AdminVendorPageResponse {
  items: AdminVendorListItem[];
  total: number;
  page: number;
  size: number;
}

export interface VendorReviewRequest {
  action: 'APPROVE' | 'REJECT';
  rejectReason?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminVendorsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin/vendors`;

  getVendors(
    keyword: string = '',
    status: string = 'ALL',
    page: number = 0,
    size: number = 10
  ): Observable<AdminVendorPageResponse> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));

    if (keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }
    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http.get<AdminVendorPageResponse>(this.baseUrl, { params });
  }

  getSummary(): Observable<AdminVendorSummary> {
    return this.http.get<AdminVendorSummary>(`${this.baseUrl}/summary`);
  }

  reviewVendor(vendorId: number, payload: VendorReviewRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/${vendorId}/review`, payload);
  }
}
