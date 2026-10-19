import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;
  let component: ConfirmDialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Xóa địa chỉ');
    fixture.componentRef.setInput('message', 'Bạn có chắc chắn muốn xóa địa chỉ này?');
    fixture.detectChanges();
  });

  it('emits confirmed when confirm button is clicked', () => {
    const spy = vi.fn();
    component.confirmed.subscribe(spy);
    component.onConfirm();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
