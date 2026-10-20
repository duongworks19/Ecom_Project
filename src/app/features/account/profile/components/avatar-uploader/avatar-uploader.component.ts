import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  input,
  output,
  signal,
} from '@angular/core';
import { AvatarComponent } from '../../../../../shared/ui/avatar/avatar.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';

const MAX_AVATAR_BYTES = 1 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png']);
const ALLOWED_EXTENSIONS = /\.(jpg|jpeg|png)$/i;

@Component({
  selector: 'app-avatar-uploader',
  standalone: true,
  imports: [AvatarComponent, ButtonComponent],
  templateUrl: './avatar-uploader.component.html',
  styleUrl: './avatar-uploader.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarUploaderComponent {
  readonly avatarUrl = input<string | null>(null);
  readonly fullName = input<string | null>(null);
  readonly uploading = input<boolean>(false);

  readonly fileSelected = output<File>();

  readonly validationError = signal<string | null>(null);

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;

  triggerFileDialog(): void {
    this.fileInput?.nativeElement.click();
  }

  onFileChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    if (!file) {
      return;
    }

    this.validationError.set(null);

    const isValidType =
      ALLOWED_MIME_TYPES.has(file.type) || ALLOWED_EXTENSIONS.test(file.name);
    if (!isValidType) {
      this.validationError.set('Chỉ chấp nhận định dạng ảnh .JPEG hoặc .PNG.');
      inputEl.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      this.validationError.set('Dung lượng ảnh tối đa là 1 MB.');
      inputEl.value = '';
      return;
    }

    this.fileSelected.emit(file);
    inputEl.value = '';
  }
}
