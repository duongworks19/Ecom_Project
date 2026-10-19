import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AvatarUploaderComponent } from './avatar-uploader.component';

describe('AvatarUploaderComponent', () => {
  let fixture: ComponentFixture<AvatarUploaderComponent>;
  let component: AvatarUploaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarUploaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarUploaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('rejects unsupported file types', () => {
    const spy = vi.fn();
    component.fileSelected.subscribe(spy);

    const badFile = new File(['abc'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [badFile], value: 'doc.pdf' } } as unknown as Event;
    component.onFileChange(event);

    expect(spy).not.toHaveBeenCalled();
    expect(component.validationError()).toContain('.JPEG hoặc .PNG');
  });

  it('rejects files larger than 1 MB', () => {
    const spy = vi.fn();
    component.fileSelected.subscribe(spy);

    const largeBuffer = new Uint8Array(1024 * 1024 + 10);
    const largeFile = new File([largeBuffer], 'big.png', { type: 'image/png' });
    const event = { target: { files: [largeFile], value: 'big.png' } } as unknown as Event;
    component.onFileChange(event);

    expect(spy).not.toHaveBeenCalled();
    expect(component.validationError()).toContain('1 MB');
  });

  it('emits fileSelected for valid JPEG/PNG <= 1 MB', () => {
    const spy = vi.fn();
    component.fileSelected.subscribe(spy);

    const validFile = new File(['ok'], 'avatar.jpg', { type: 'image/jpeg' });
    const event = { target: { files: [validFile], value: 'avatar.jpg' } } as unknown as Event;
    component.onFileChange(event);

    expect(component.validationError()).toBeNull();
    expect(spy).toHaveBeenCalledWith(validFile);
  });
});
