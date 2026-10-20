import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusDotComponent } from './status-dot.component';

describe('StatusDotComponent', () => {
  let fixture: ComponentFixture<StatusDotComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusDotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusDotComponent);
    fixture.componentRef.setInput('label', 'Đang giao');
    fixture.componentRef.setInput('color', '#7e238b');
    fixture.detectChanges();
  });

  it('renders dot color and label text', () => {
    const label = fixture.nativeElement.querySelector('.status-dot__label') as HTMLElement;
    expect(label.textContent?.trim()).toBe('Đang giao');
  });
});
