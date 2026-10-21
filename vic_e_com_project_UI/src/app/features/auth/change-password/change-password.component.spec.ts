import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../../../core/services/auth.service';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let authServiceMock: {
    changePassword: ReturnType<typeof vi.fn>;
    getRole: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceMock = {
      changePassword: vi.fn(),
      getRole: vi.fn().mockReturnValue('SHIPPER'),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the first-login wrapper and delegates to the shared form', () => {
    expect(fixture.nativeElement.querySelector('.brand-badge')?.textContent).toContain('VICMART');
    expect(fixture.nativeElement.querySelector('.card-title')?.textContent).toContain(
      'Đổi mật khẩu',
    );
    expect(fixture.nativeElement.querySelector('app-password-form')).not.toBeNull();
  });
});
