import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
  brandCount: number;
  productCount: number;
  status: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class AdminCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly API = `${environment.apiUrl}/admin/categories`;

  getCategories(): Observable<{ data: AdminCategory[] }> {
    return this.http.get<{ data: AdminCategory[] }>(this.API);
  }

  createCategory(payload: { name: string; icon?: string }): Observable<{ data: AdminCategory }> {
    return this.http.post<{ data: AdminCategory }>(this.API, payload);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete(`${this.API}/${id}`);
  }
}
