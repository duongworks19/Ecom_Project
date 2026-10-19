import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DialogComponent } from './dialog.component';

describe('DialogComponent', () => {
  let fixture: ComponentFixture<DialogComponent>;
  let component: DialogComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Thêm địa chỉ mới');
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('renders dialog with role="dialog" and aria-modal="true" when open', () => {
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(fixture.nativeElement.textContent).toContain('Thêm địa chỉ mới');
  });

  it('emits closed on Escape key press', () => {
    const spy = vi.fn();
    component.closed.subscribe(spy);

    const scrim = fixture.nativeElement.querySelector('.dialog-scrim') as HTMLElement;
    scrim.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
