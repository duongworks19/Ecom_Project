import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../../../../core/config/api-base-url.token';
import { ProfileApiService } from './profile-api.service';
import { CustomerProfile } from './profile.models';

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    });
    service = TestBed.inject(ProfileApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GET /api/customer/profile fetches and stores profile in signal', async () => {
    const sample: CustomerProfile = {
      id: 10,
      fullName: 'Nguyễn Minh Anh',
      email: 'minhanh@gmail.com',
      phone: '0901234218',
      avatarUrl: null,
    };

    const promise = firstValueFrom(service.getProfile());
    const req = httpMock.expectOne('/api/customer/profile');
    expect(req.request.method).toBe('GET');
    req.flush(sample);

    const res = await promise;
    expect(res).toEqual(sample);
    expect(service.profile()).toEqual(sample);
  });

  it('PUT /api/customer/profile sends fullName and phone and maps 409 field conflict', async () => {
    const updatePromise = firstValueFrom(
      service.updateProfile({ fullName: 'Nguyễn Minh Anh', phone: '0901234218' })
    ).catch((e) => e);

    const req = httpMock.expectOne('/api/customer/profile');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ fullName: 'Nguyễn Minh Anh', phone: '0901234218' });
    req.flush(
      { status: 409, code: 'PHONE_TAKEN', message: 'Số điện thoại đã tồn tại', field: 'phone' },
      { status: 409, statusText: 'Conflict' }
    );

    const err = await updatePromise;
    expect(err.status).toBe(409);
    expect(err.field).toBe('phone');
  });

  it('POST /api/customer/profile/avatar uploads multipart file and updates avatarUrl', async () => {
    service.profile.set({
      id: 10,
      fullName: 'Nguyễn Minh Anh',
      email: 'minhanh@gmail.com',
      phone: '0901234218',
      avatarUrl: null,
    });

    const file = new File(['dummy'], 'avatar.png', { type: 'image/png' });
    const promise = firstValueFrom(service.uploadAvatar(file));

    const req = httpMock.expectOne('/api/customer/profile/avatar');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBe(true);
    expect((req.request.body as FormData).get('file')).toBe(file);
    req.flush({ avatarUrl: 'https://cdn.example.com/a.png' });

    const res = await promise;
    expect(res.avatarUrl).toBe('https://cdn.example.com/a.png');
    expect(service.profile()?.avatarUrl).toBe('https://cdn.example.com/a.png');
  });

  it('POST /api/auth/logout clears session even if backend returns error', async () => {
    const promise = firstValueFrom(service.logout());
    const req = httpMock.expectOne('/api/auth/logout');
    expect(req.request.method).toBe('POST');
    req.flush({ message: 'Logged out' });

    await promise;
    expect(service.profile()).toBeNull();
  });
});
