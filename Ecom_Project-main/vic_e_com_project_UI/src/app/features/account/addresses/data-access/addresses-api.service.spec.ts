import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { AddressesApiService } from './addresses-api.service';
import { CustomerAddress, UpsertCustomerAddressRequest } from './addresses.models';

describe('AddressesApiService', () => {
  let service: AddressesApiService;
  let httpMock: HttpTestingController;

  const sampleAddress: CustomerAddress = {
    id: 1,
    recipientName: 'Nguyễn Minh Anh',
    phone: '0901234218',
    streetAddress: '45 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
    isDefault: true,
  };

  const upsertPayload: UpsertCustomerAddressRequest = {
    recipientName: 'Nguyễn Minh Anh',
    phone: '0901234218',
    streetAddress: '45 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
    isDefault: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(AddressesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('calls GET, POST, PUT, PATCH default and DELETE on /api/customer/addresses', async () => {
    const listPromise = firstValueFrom(service.listAddresses());
    httpMock.expectOne('/api/customer/addresses').flush([sampleAddress]);
    expect(await listPromise).toEqual([sampleAddress]);

    const createPromise = firstValueFrom(service.createAddress(upsertPayload));
    const postReq = httpMock.expectOne('/api/customer/addresses');
    expect(postReq.request.method).toBe('POST');
    postReq.flush(sampleAddress);
    expect(await createPromise).toEqual(sampleAddress);

    const updatePromise = firstValueFrom(service.updateAddress(1, upsertPayload));
    const putReq = httpMock.expectOne('/api/customer/addresses/1');
    expect(putReq.request.method).toBe('PUT');
    putReq.flush(sampleAddress);
    expect(await updatePromise).toEqual(sampleAddress);

    const patchPromise = firstValueFrom(service.setDefaultAddress(1));
    const patchReq = httpMock.expectOne('/api/customer/addresses/1/default');
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush(sampleAddress);
    await patchPromise;

    const delPromise = firstValueFrom(service.deleteAddress(1));
    const delReq = httpMock.expectOne('/api/customer/addresses/1');
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush(null);
    await delPromise;
  });
});
