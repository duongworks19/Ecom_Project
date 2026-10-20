import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrderStatusTabsComponent } from './order-status-tabs.component';

describe('OrderStatusTabsComponent', () => {
  let fixture: ComponentFixture<OrderStatusTabsComponent>;
  let component: OrderStatusTabsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderStatusTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderStatusTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders 6 tabs with role="tab" and supports ArrowRight keyboard navigation', () => {
    const spy = vi.fn();
    component.statusChanged.subscribe(spy);

    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    expect(tabs.length).toBe(6);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');

    tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(spy).toHaveBeenCalledWith('PENDING');
  });
});
