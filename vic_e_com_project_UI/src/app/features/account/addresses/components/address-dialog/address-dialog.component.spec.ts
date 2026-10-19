import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AddressDialogComponent } from './address-dialog.component';

describe('AddressDialogComponent', () => {
  let fixture: ComponentFixture<AddressDialogComponent>;
  let component: AddressDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddressDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AddressDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('validates required fields and emits normalized payload when valid', () => {
    const spy = vi.fn();
    component.saved.subscribe(spy);

    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();

    component.form.setValue({
      recipientName: '  Nguyễn Minh Anh ',
      phone: '090 123 4218',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      streetAddress: '45 Nguyễn Huệ, Lầu 3',
      isDefault: true,
    });

    component.onSubmit();
    expect(spy).toHaveBeenCalledWith({
      recipientName: 'Nguyễn Minh Anh',
      phone: '0901234218',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      streetAddress: '45 Nguyễn Huệ, Lầu 3',
      isDefault: true,
    });
  });

  it('disables isDefault checkbox when editing an already-default address', () => {
    fixture.componentRef.setInput('initialAddress', {
      id: 1,
      recipientName: 'Nguyễn Minh Anh',
      phone: '0901234218',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      streetAddress: '45 Nguyễn Huệ',
      isDefault: true,
    });
    fixture.detectChanges();

    expect(component.form.controls.isDefault.disabled).toBe(true);
  });
});
