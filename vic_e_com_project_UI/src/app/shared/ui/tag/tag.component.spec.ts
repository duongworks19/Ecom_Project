import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TagComponent } from './tag.component';

describe('TagComponent', () => {
  it('renders tag label', async () => {
    await TestBed.configureTestingModule({
      imports: [TagComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(TagComponent);
    fixture.componentRef.setInput('label', 'Mặc định');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent.trim()).toBe('Mặc định');
  });
});
