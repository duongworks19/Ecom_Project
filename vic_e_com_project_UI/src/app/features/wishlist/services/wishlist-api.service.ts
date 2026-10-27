import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../shared/models/api-response.model';
import {
  WishlistPageResponse,
  WishlistIdsResponse,
} from '../models/wishlist.models';

@Injectable({ providedIn: 'root' })
export class WishlistApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/wishlist`;

  getPage(page: number, size = 20): Observable<WishlistPageResponse> {
    return this.http
      .get<ApiResponse<WishlistPageResponse>>(this.base, {
        params: { page: String(page), size: String(size) },
      })
      .pipe(map((res) => res.data));
  }

  getIds(): Observable<WishlistIdsResponse> {
    return this.http
      .get<ApiResponse<WishlistIdsResponse>>(`${this.base}/ids`)
      .pipe(map((res) => res.data));
  }

  add(productId: number): Observable<void> {
    return this.http
      .put<void>(`${this.base}/${productId}`, null)
      .pipe(map(() => undefined));
  }

  remove(productId: number): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${productId}`)
      .pipe(map(() => undefined));
  }
}
