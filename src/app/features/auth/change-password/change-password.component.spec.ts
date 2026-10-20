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
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('evaluates password rules in real time and enables submit only when valid', () => {
    expect(component.isFormValid()).toBe(false);

    component.form.patchValue({
      currentPassword: 'Temp@12345',
      newPassword: 'short',
      confirmPassword: 'short',
    });
    expect(component.ruleMinLength()).toBe(false);
    expect(component.isFormValid()).toBe(false);

    component.form.patchValue({
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });
    expect(component.ruleMinLength()).toBe(true);
    expect(component.ruleUpperLowerNumber()).toBe(true);
    expect(component.ruleDifferentFromCurrent()).toBe(true);
    expect(component.ruleConfirmMatch()).toBe(true);
    expect(component.isFormValid()).toBe(true);
  });

  it('displays error on currentPassword control when API returns 400', () => {
    authServiceMock.changePassword.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { message: 'Mật khẩu hiện tại không chính xác' },
          })
      )
    );

    component.form.patchValue({
      currentPassword: 'WrongPassword1',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });

    component.onSubmit();
    expect(component.form.controls.currentPassword.hasError('incorrect')).toBe(true);
  });
});
