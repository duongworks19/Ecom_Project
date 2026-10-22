import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountLayoutComponent } from './account-layout.component';

describe('AccountLayoutComponent', () => {
  let fixture: ComponentFixture<AccountLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountLayoutComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountLayoutComponent);
    fixture.detectChanges();
  });

  it('renders sidebar links for Hồ sơ, Địa chỉ and Đơn mua', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('TÀI KHOẢN CỦA TÔI');
    expect(text).toContain('Hồ sơ');
    expect(text).toContain('Địa chỉ');
    expect(text).toContain('ĐƠN HÀNG');
    expect(text).toContain('Đơn mua');
  });
});
