import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonComponent } from './skeleton.component';

describe('SkeletonComponent', () => {
  it('applies custom width and height', async () => {
    await TestBed.configureTestingModule({
      imports: [SkeletonComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(SkeletonComponent);
    fixture.componentRef.setInput('width', '140px');
    fixture.componentRef.setInput('height', '44px');
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('.vic-skeleton') as HTMLElement;
    expect(el.style.width).toBe('140px');
    expect(el.style.height).toBe('44px');
  });
});
