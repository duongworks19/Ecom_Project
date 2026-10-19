import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorStateComponent } from './error-state.component';

describe('ErrorStateComponent', () => {
  it('renders error message and emits retry when button clicked', async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorStateComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(ErrorStateComponent);
    fixture.componentRef.setInput('message', 'Không thể kết nối máy chủ.');
    fixture.detectChanges();

    const spy = vi.fn();
    fixture.componentInstance.retry.subscribe(spy);

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(fixture.nativeElement.textContent).toContain('Không thể kết nối máy chủ.');
    expect(btn.textContent?.trim()).toBe('Thử lại');
    btn.click();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
