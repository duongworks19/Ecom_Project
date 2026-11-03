import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SellerShopApiService {
  private readonly http = inject(HttpClient);
  private readonly shopsUrl = `${environment.apiUrl}/shops`;
  private readonly profileUrl = `${environment.apiUrl}/seller/profile`;

  getCurrentShop(): Observable<any> {
    return this.http.get<any>(`${this.shopsUrl}/current`);
  }

  updateCurrentShop(payload: any): Observable<any> {
    return this.http.put<any>(`${this.shopsUrl}/current`, payload);
  }

  getSellerProfile(): Observable<any> {
    return this.http.get<any>(this.profileUrl);
  }

  uploadLogo(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<any>(`${environment.apiUrl}/media/image?folder=shops/logos`, formData)
      .pipe(map((res) => res?.data?.url || res?.url || ''));
  }
}
