import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastComponent } from './toast.component';
import { ToastService } from './toast.service';

describe('ToastComponent', () => {
  let fixture: ComponentFixture<ToastComponent>;
  let toastService: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ToastComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ToastComponent);
    toastService = TestBed.inject(ToastService);
  });

  it('displays toast message when ToastService.show is called', () => {
    toastService.success('Đã lưu thay đổi');
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.vic-toast') as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.textContent).toContain('Đã lưu thay đổi');
  });
});
