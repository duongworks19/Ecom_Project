import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuestionItem } from '../../models/seller-dashboard.model';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerQaReviewsApiService } from '../../services/seller-qa-reviews-api.service';

@Component({
  selector: 'app-seller-qa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-qa.component.html',
  styleUrl: './seller-qa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerQaComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly qaReviewsApi = inject(SellerQaReviewsApiService);

  readonly questions = this.store.questions;

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.qaReviewsApi.getQuestions().subscribe({
      next: (res) => {
        const raw = res?.data || res || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: QuestionItem[] = raw.map((item: any) => ({
            id: item.id,
            p: item.productName || item.productTitle || item.p || 'Sản phẩm',
            who: item.customerName || item.userName || item.who || 'Khách hàng',
            x: item.content || item.question || item.x || '',
            a: item.answer || item.reply || item.a || undefined,
          }));
          this.questions.set(mapped);
        }
      },
      error: () => {},
    });
  }

  answerQuestion(question: QuestionItem): void {
    const defaultMsg = 'Chào bạn, sản phẩm hiện đang sẵn kho và được bảo hành chính hãng ạ.';
    const userPrompt = prompt('Nhập câu trả lời cho khách hàng:', defaultMsg);
    if (userPrompt === null) return;
    const answerText = userPrompt.trim() || defaultMsg;

    question.a = answerText;
    this.questions.update((list) => [...list]);
    localStorage.setItem('vic_seller_questions', JSON.stringify(this.questions()));

    this.syncQuestionAnswerToProductStorage(question.id, question.p, answerText);

    if (question.id) {
      this.qaReviewsApi.replyQuestion(question.id, answerText).subscribe({
        next: () => this.store.showToast('✨ Đã gửi câu trả lời thành công!'),
        error: () => this.store.showToast('✨ Đã lưu câu trả lời.'),
      });
    }
  }

  private syncQuestionAnswerToProductStorage(questionId: number, productName: string, answerText: string): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('vic_product_questions_')) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(list)) {
            let changed = false;
            for (const q of list) {
              if (q.id === questionId || (productName && q.question === questionId)) {
                q.answer = answerText;
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
