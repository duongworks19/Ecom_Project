import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CancelOrderDialogComponent } from './cancel-order-dialog.component';

describe('CancelOrderDialogComponent', () => {
  it('requires reason >= 5 chars before emitting confirmed', async () => {
    await TestBed.configureTestingModule({
      imports: [CancelOrderDialogComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(CancelOrderDialogComponent);
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();

    const spy = vi.fn();
    component.confirmed.subscribe(spy);

    component.form.controls.reason.setValue('abc');
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();

    component.form.controls.reason.setValue('Đặt nhầm kích cỡ sản phẩm');
    component.onSubmit();
    expect(spy).toHaveBeenCalledWith('Đặt nhầm kích cỡ sản phẩm');
  });
});
