import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar.component';

describe('AvatarComponent', () => {
  let fixture: ComponentFixture<AvatarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarComponent);
  });

  it('renders first letter of name when src is null', () => {
    fixture.componentRef.setInput('name', 'An Nhiên');
    fixture.componentRef.setInput('src', null);
    fixture.detectChanges();

    const initial = fixture.nativeElement.querySelector('.vic-avatar__initial') as HTMLElement;
    expect(initial.textContent?.trim()).toBe('A');
  });

  it('renders image when src is provided', () => {
    fixture.componentRef.setInput('name', 'An Nhiên');
    fixture.componentRef.setInput('src', 'https://example.com/avatar.png');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar.png');
  });
});
