import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { API_BASE_URL } from '../../../../../core/config/api-base-url.token';
import { ProfilePageComponent } from './profile-page.component';
import { CustomerProfile } from '../../data-access/profile.models';

describe('ProfilePageComponent', () => {
  let fixture: ComponentFixture<ProfilePageComponent>;
  let component: ProfilePageComponent;
  let httpMock: HttpTestingController;

  const sampleProfile: CustomerProfile = {
    id: 1,
    fullName: 'Nguyễn Minh Anh',
    email: 'minhanh@gmail.com',
    phone: '0901234218',
    avatarUrl: null,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePageComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/api' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePageComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('shows skeleton while loading and renders masked email and phone after load', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-skeleton')).toBeTruthy();

    const req = httpMock.expectOne('/api/customer/profile');
    req.flush(sampleProfile);
    fixture.detectChanges();

    const emailInput = fixture.nativeElement.querySelector('#profile-email') as HTMLInputElement;
    expect(emailInput.value).toBe('mi*****@gmail.com');
    expect(fixture.nativeElement.textContent).toContain('090****218');
  });

  it('switches phone to editable input when Thay đổi is clicked and submits normalized phone', () => {
    fixture.detectChanges();
    httpMock.expectOne('/api/customer/profile').flush(sampleProfile);
    fixture.detectChanges();

    component.enablePhoneEditing();
    fixture.detectChanges();

    component.form.controls.fullName.setValue('  Nguyễn Minh Anh Mới  ');
    component.form.controls.phone.setValue('091 234 5678');
    component.onSave();

    const putReq = httpMock.expectOne('/api/customer/profile');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.body).toEqual({
      fullName: 'Nguyễn Minh Anh Mới',
      phone: '0912345678',
    });
    putReq.flush({
      ...sampleProfile,
      fullName: 'Nguyễn Minh Anh Mới',
      phone: '0912345678',
    });
    fixture.detectChanges();

    expect(component.isEditingPhone()).toBe(false);
  });

  it('renders ErrorState with retry button when initial GET fails', () => {
    fixture.detectChanges();
    httpMock
      .expectOne('/api/customer/profile')
      .flush({ message: 'Lỗi mạng' }, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-error-state')).toBeTruthy();
  });
});
