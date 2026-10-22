import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';
import { PasswordFormComponent } from './password-form.component';
import { AuthService } from '../../../core/services/auth.service';

describe('PasswordFormComponent', () => {
  let component: PasswordFormComponent;
  let fixture: ComponentFixture<PasswordFormComponent>;
  let authServiceMock: {
    changePassword: ReturnType<typeof vi.fn>;
    logout: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authServiceMock = {
      changePassword: vi.fn().mockReturnValue(of({ message: 'ok', data: null })),
      logout: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PasswordFormComponent],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(PasswordFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  function fillValidForm(): void {
    component.form.patchValue({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword123',
      confirmPassword: 'NewPassword123',
    });
  }

  it('resets the form and emits changed after a successful submit', () => {
    const changedSpy = vi.fn();
    component.changed.subscribe(changedSpy);

    fillValidForm();
    component.onSubmit();

    expect(authServiceMock.changePassword).toHaveBeenCalledTimes(1);
    expect(changedSpy).toHaveBeenCalledTimes(1);
    expect(component.form.getRawValue()).toEqual({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    expect(component.errorMessage()).toBeNull();
  });

  it('shows a grouped error message for non-400 failures', () => {
    authServiceMock.changePassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    fillValidForm();
    component.onSubmit();
    expect(component.errorMessage()).toBe('Không thể đổi mật khẩu, vui lòng thử lại sau');

    authServiceMock.changePassword.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );
    component.onSubmit();
    expect(component.errorMessage()).toBe('Không kết nối được máy chủ, vui lòng thử lại');
  });
});
