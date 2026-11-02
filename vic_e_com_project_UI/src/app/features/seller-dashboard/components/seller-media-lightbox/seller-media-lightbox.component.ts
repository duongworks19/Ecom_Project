import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LightboxMediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  sortOrder?: number;
}

@Component({
  selector: 'app-seller-media-lightbox',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-media-lightbox.component.html',
  styleUrl: './seller-media-lightbox.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerMediaLightboxComponent {
  @Input() isOpen = false;
  @Input() mediaList: LightboxMediaItem[] = [];
  @Input() selectedIndex = 0;

  @Output() close = new EventEmitter<void>();
  @Output() indexChange = new EventEmitter<number>();

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  @HostListener('document:keydown.arrowleft')
  handleArrowLeft(): void {
    if (this.isOpen && this.mediaList.length > 1) {
      this.prevMedia();
    }
  }

  @HostListener('document:keydown.arrowright')
  handleArrowRight(): void {
    if (this.isOpen && this.mediaList.length > 1) {
      this.nextMedia();
    }
  }

  prevMedia(): void {
    const total = this.mediaList.length;
    if (total <= 1) return;
    const nextIdx = (this.selectedIndex - 1 + total) % total;
    this.indexChange.emit(nextIdx);
  }

  nextMedia(): void {
    const total = this.mediaList.length;
    if (total <= 1) return;
    const nextIdx = (this.selectedIndex + 1) % total;
    this.indexChange.emit(nextIdx);
  }
}
