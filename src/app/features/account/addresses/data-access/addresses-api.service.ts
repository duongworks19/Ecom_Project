import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { mapHttpError } from '../../../../core/api/api-error.mapper';
import { CustomerAddress, UpsertCustomerAddressRequest } from './addresses.models';
import { ADDRESSES_ENDPOINTS } from './addresses.endpoints';

interface WrappedResponse<T> {
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class AddressesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  listAddresses(): Observable<CustomerAddress[]> {
    return this.http
      .get<CustomerAddress[] | WrappedResponse<CustomerAddress[]>>(
        `${this.baseUrl}${ADDRESSES_ENDPOINTS.base}`
      )
      .pipe(
        map((res) => this.unwrap<CustomerAddress[]>(res) ?? []),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  createAddress(payload: UpsertCustomerAddressRequest): Observable<CustomerAddress> {
    return this.http
      .post<CustomerAddress | WrappedResponse<CustomerAddress>>(
        `${this.baseUrl}${ADDRESSES_ENDPOINTS.base}`,
        payload
      )
      .pipe(
        map((res) => this.unwrap<CustomerAddress>(res)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  updateAddress(id: number, payload: UpsertCustomerAddressRequest): Observable<CustomerAddress> {
    return this.http
      .put<CustomerAddress | WrappedResponse<CustomerAddress>>(
        `${this.baseUrl}${ADDRESSES_ENDPOINTS.byId(id)}`,
        payload
      )
      .pipe(
        map((res) => this.unwrap<CustomerAddress>(res)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  setDefaultAddress(id: number): Observable<CustomerAddress | void> {
    return this.http
      .patch<CustomerAddress | WrappedResponse<CustomerAddress> | void>(
        `${this.baseUrl}${ADDRESSES_ENDPOINTS.setDefault(id)}`,
        {}
      )
      .pipe(
        map((res) => (res ? this.unwrap<CustomerAddress>(res) : undefined)),
        catchError((err) => throwError(() => mapHttpError(err)))
      );
  }

  deleteAddress(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.baseUrl}${ADDRESSES_ENDPOINTS.byId(id)}`)
      .pipe(catchError((err) => throwError(() => mapHttpError(err))));
  }

  private unwrap<T>(res: T | WrappedResponse<T>): T {
    if (res && typeof res === 'object' && 'data' in res && (res as WrappedResponse<T>).data !== undefined) {
      return (res as WrappedResponse<T>).data as T;
    }
    return res as T;
  }
}
