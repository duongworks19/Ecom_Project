import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

describe('EmptyStateComponent', () => {
  it('renders title and description', async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyStateComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('title', 'Chưa có dữ liệu');
    fixture.componentRef.setInput('description', 'Hãy thêm mục đầu tiên của bạn.');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Chưa có dữ liệu');
    expect(fixture.nativeElement.textContent).toContain('Hãy thêm mục đầu tiên của bạn.');
  });
});
