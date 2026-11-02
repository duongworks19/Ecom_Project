import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerProductService } from '../../services/seller-product.service';

export interface ProductMediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  sortOrder: number;
}

@Component({
  selector: 'app-seller-product-media',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-product-media.component.html',
  styleUrl: './seller-product-media.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProductMediaComponent {
  private readonly productService = inject(SellerProductService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() mediaList: ProductMediaItem[] = [];
  @Input() imageUrl = '';
  @Input() selectedIndex = 0;

  @Output() mediaListChange = new EventEmitter<ProductMediaItem[]>();
  @Output() imageUrlChange = new EventEmitter<string>();
  @Output() selectedIndexChange = new EventEmitter<number>();
  @Output() previewRequest = new EventEmitter<number>();
  @Output() uploadError = new EventEmitter<string>();

  readonly mediaUploading = signal<boolean>(false);

  selectMedia(index: number): void {
    this.selectedIndexChange.emit(index);
  }

  openPreview(index: number): void {
    this.previewRequest.emit(index);
  }

  clearImage(): void {
    this.mediaListChange.emit([]);
    this.imageUrlChange.emit('');
    this.selectedIndexChange.emit(0);
  }

  onUrlChange(url: string): void {
    this.imageUrlChange.emit(url);
    const trimmed = url.trim();
    if (trimmed && this.mediaList.length === 0) {
      const isVideo = /\.(mp4|webm|ogg|mov)$/i.test(trimmed);
      this.mediaListChange.emit([{ url: trimmed, type: isVideo ? 'VIDEO' : 'IMAGE', sortOrder: 0 }]);
      this.selectedIndexChange.emit(0);
    }
  }

  onImageError(): void {
    // Keep UI graceful when offline
  }

  onMultipleMediaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    this.mediaUploading.set(true);
    let done = 0;

    files.forEach((file) => {
      this.productService.uploadMedia(file).subscribe({
        next: (res) => {
          const m = res?.data || res;
          const wasEmpty = this.mediaList.length === 0;
          const updated = [
            ...this.mediaList,
            { url: m.url, type: (m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO', sortOrder: this.mediaList.length },
          ];
          this.mediaList = updated;
          this.mediaListChange.emit(updated);
          if (!this.imageUrl) {
            this.imageUrl = m.url;
            this.imageUrlChange.emit(m.url);
          }
          if (wasEmpty) {
            this.selectedIndexChange.emit(0);
          }
          if (++done === files.length) {
            this.mediaUploading.set(false);
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.uploadError.emit('Không thể upload một hoặc nhiều file lên Cloudinary.');
          if (++done === files.length) {
            this.mediaUploading.set(false);
          }
          this.cdr.markForCheck();
        },
      });
    });
    input.value = '';
  }

  removeMedia(index: number): void {
    const currentSelected = this.selectedIndex;
    const newList = this.mediaList.filter((_, i) => i !== index).map((m, i) => ({ ...m, sortOrder: i }));
    this.mediaListChange.emit(newList);

    if (newList.length === 0) {
      this.selectedIndexChange.emit(0);
      this.imageUrlChange.emit('');
    } else if (currentSelected === index) {
      const nextIndex = Math.min(index, newList.length - 1);
      this.selectedIndexChange.emit(nextIndex);
      this.imageUrlChange.emit(newList[0]?.url || '');
    } else if (currentSelected > index) {
      this.selectedIndexChange.emit(currentSelected - 1);
      this.imageUrlChange.emit(newList[0]?.url || '');
    } else {
      this.selectedIndexChange.emit(Math.min(currentSelected, newList.length - 1));
      this.imageUrlChange.emit(newList[0]?.url || '');
    }
  }

  moveMedia(index: number, direction: -1 | 1): void {
    const next = index + direction;
    const list = [...this.mediaList];
    if (next < 0 || next >= list.length) return;

    const currentSelected = this.selectedIndex;
    let newSelected = currentSelected;
    if (currentSelected === index) {
      newSelected = next;
    } else if (currentSelected === next) {
      newSelected = index;
    }

    [list[index], list[next]] = [list[next], list[index]];
    const updatedList = list.map((m, i) => ({ ...m, sortOrder: i }));
    this.mediaListChange.emit(updatedList);
    this.selectedIndexChange.emit(newSelected);
    this.imageUrlChange.emit(updatedList[0]?.url || '');
  }
}
