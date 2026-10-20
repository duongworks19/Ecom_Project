import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressCardComponent } from './address-card.component';
import { CustomerAddress } from '../../data-access/addresses.models';

describe('AddressCardComponent', () => {
  const defaultAddr: CustomerAddress = {
    id: 1,
    recipientName: 'Nguyễn Minh Anh',
    phone: '0901234218',
    streetAddress: '45 Nguyễn Huệ',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    province: 'TP. Hồ Chí Minh',
    isDefault: true,
  };

  it('shows Mặc định tag and hides Xóa and Thiết lập mặc định when address isDefault is true', async () => {
    await TestBed.configureTestingModule({
      imports: [AddressCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddressCardComponent);
    fixture.componentRef.setInput('address', defaultAddr);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Mặc định');
    expect(text).toContain('Cập nhật');
    expect(text).not.toContain('Xóa');
    expect(text).not.toContain('Thiết lập mặc định');
  });

  it('shows Xóa and Thiết lập mặc định when address isDefault is false', async () => {
    await TestBed.configureTestingModule({
      imports: [AddressCardComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(AddressCardComponent);
    fixture.componentRef.setInput('address', { ...defaultAddr, isDefault: false });
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Xóa');
    expect(text).toContain('Thiết lập mặc định');
  });
});
