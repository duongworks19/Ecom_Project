import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReviewItem } from '../../models/seller-dashboard.model';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerQaReviewsApiService } from '../../services/seller-qa-reviews-api.service';

@Component({
  selector: 'app-seller-reviews',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-reviews.component.html',
  styleUrl: './seller-reviews.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerReviewsComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly qaReviewsApi = inject(SellerQaReviewsApiService);

  readonly reviews = this.store.reviews;

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.qaReviewsApi.getReviews().subscribe({
      next: (res) => {
        const raw = res?.data || res || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: ReviewItem[] = raw.map((item: any) => ({
            id: item.id,
            p: item.productName || item.productTitle || item.p || 'Sản phẩm',
            who: item.customerName || item.userName || item.who || 'Khách hàng',
            st: item.rating || item.st || 5,
            x: item.content || item.comment || item.x || '',
            re: item.reply || item.re || undefined,
          }));
          this.reviews.set(mapped);
        }
      },
      error: () => {},
    });
  }

  replyToReview(review: ReviewItem): void {
    const defaultMsg = 'Cảm ơn bạn đã tin tưởng và ủng hộ gian hàng của chúng tôi!';
    const userPrompt = prompt('Nhập nội dung phản hồi cho đánh giá này:', defaultMsg);
    if (userPrompt === null) return;
    const replyText = userPrompt.trim() || defaultMsg;

    review.re = replyText;
    this.reviews.update((list) => [...list]);
    localStorage.setItem('vic_seller_reviews', JSON.stringify(this.reviews()));

    this.syncReviewReplyToProductStorage(review.id, review.p, replyText);

    if (review.id) {
      this.qaReviewsApi.replyReview(review.id, replyText).subscribe({
        next: () => this.store.showToast('✨ Đã gửi phản hồi đánh giá thành công!'),
        error: () => this.store.showToast('✨ Đã lưu phản hồi.'),
      });
    }
  }

  private syncReviewReplyToProductStorage(reviewId: number, productName: string, replyText: string): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vic_product_reviews_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            let changed = false;
            for (const r of list) {
              if (r.id === reviewId) {
                r.reply = replyText;
                changed = true;
              }
            }
            if (changed) {
              localStorage.setItem(key, JSON.stringify(list));
            }
          }
        } catch {}
      }
    }
  }
}
