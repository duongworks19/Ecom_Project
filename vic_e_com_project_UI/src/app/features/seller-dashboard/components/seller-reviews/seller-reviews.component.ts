import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerReviewQuestion } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-reviews.component.html',
  styleUrl: './seller-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerReviewsComponent {
  readonly reviews = input.required<SellerReviewQuestion[]>();
  readonly shopName = input<string>('Gian hàng');

  readonly submitReply = output<{ id: number; reply: string }>();

  readonly filterType = signal<'ALL' | 'UNREPLIED'>('ALL');

  readonly targetReviewForReply = signal<SellerReviewQuestion | null>(null);
  readonly replyText = signal<string>('');
  readonly replyError = signal<string | null>(null);

  readonly filteredReviews = computed(() => {
    const list = this.reviews();
    if (this.filterType() === 'UNREPLIED') {
      return list.filter((r) => !r.reply);
    }
    return list;
  });

  readonly unrepliedCount = computed(
    () => this.reviews().filter((r) => !r.reply).length
  );

  openReply(item: SellerReviewQuestion): void {
    this.targetReviewForReply.set(item);
    this.replyText.set('');
    this.replyError.set(null);
  }

  closeReply(): void {
    this.targetReviewForReply.set(null);
  }

  confirmReply(): void {
    const text = this.replyText().trim();
    if (text.length < 5) {
      this.replyError.set('Nội dung phản hồi tối thiểu 5 ký tự.');
      return;
    }
    const item = this.targetReviewForReply();
    if (item) {
      this.submitReply.emit({ id: item.id, reply: text });
    }
    this.closeReply();
  }
}
