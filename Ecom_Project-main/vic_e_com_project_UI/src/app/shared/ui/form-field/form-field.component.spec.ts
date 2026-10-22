import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormFieldComponent } from './form-field.component';

describe('FormFieldComponent', () => {
  let fixture: ComponentFixture<FormFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormFieldComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FormFieldComponent);
    fixture.componentRef.setInput('label', 'Số điện thoại');
    fixture.componentRef.setInput('controlId', 'phone-input');
    fixture.detectChanges();
  });

  it('renders label and associates with controlId', () => {
    const label = fixture.nativeElement.querySelector('label') as HTMLLabelElement;
    expect(label.getAttribute('for')).toBe('phone-input');
    expect(label.textContent).toContain('Số điện thoại');
  });

  it('displays error with matching id and role="alert"', () => {
    fixture.componentRef.setInput('error', 'Số điện thoại không hợp lệ');
    fixture.detectChanges();

    const err = fixture.nativeElement.querySelector('#phone-input-error') as HTMLElement;
    expect(err).toBeTruthy();
    expect(err.getAttribute('role')).toBe('alert');
    expect(err.textContent?.trim()).toBe('Số điện thoại không hợp lệ');
  });
});
