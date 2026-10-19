import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { AddressesPageComponent } from './addresses-page.component';
import { CustomerAddress } from '../../data-access/addresses.models';

describe('AddressesPageComponent', () => {
  let fixture: ComponentFixture<AddressesPageComponent>;
  let component: AddressesPageComponent;
  let httpMock: HttpTestingController;

  const sampleList: CustomerAddress[] = [
    {
      id: 2,
      recipientName: 'Nguyễn Minh Anh',
      phone: '0901234218',
      streetAddress: 'Tòa nhà Bitexco, Số 2 Hải Triều',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      isDefault: false,
    },
    {
      id: 1,
      recipientName: 'Nguyễn Minh Anh',
      phone: '0901234218',
      streetAddress: '45 Nguyễn Huệ, Lầu 3',
      ward: 'Phường Bến Nghé',
      district: 'Quận 1',
      province: 'TP. Hồ Chí Minh',
      isDefault: true,
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressesPageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressesPageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('sorts default address first when loaded', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/customer/addresses').flush(sampleList);
    fixture.detectChanges();

    expect(component.sortedAddresses()[0].id).toBe(1);
    expect(component.sortedAddresses()[0].isDefault).toBe(true);
  });

  it('renders empty state when backend returns empty array', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/customer/addresses').flush([]);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Bạn chưa lưu địa chỉ nhận hàng nào.');
  });

  it('sets default address via PATCH and updates signals', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/customer/addresses').flush(sampleList);
    fixture.detectChanges();

    component.onSetDefault(sampleList[0]);
    const patchReq = httpMock.expectOne('/api/customer/addresses/2/default');
    expect(patchReq.request.method).toBe('PATCH');
    patchReq.flush({ ...sampleList[0], isDefault: true });
    fixture.detectChanges();

    expect(component.sortedAddresses()[0].id).toBe(2);
    expect(component.sortedAddresses()[0].isDefault).toBe(true);
  });
});
