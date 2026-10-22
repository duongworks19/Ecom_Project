import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerQaQuestion } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-qa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-qa.component.html',
  styleUrl: './seller-qa.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerQaComponent {
  readonly questions = input.required<SellerQaQuestion[]>();

  readonly submitAnswer = output<{ id: number; answer: string }>();

  readonly targetQaForAnswer = signal<SellerQaQuestion | null>(null);
  readonly answerText = signal<string>('');
  readonly answerError = signal<string | null>(null);

  openAnswer(item: SellerQaQuestion): void {
    this.targetQaForAnswer.set(item);
    this.answerText.set('');
    this.answerError.set(null);
  }

  closeAnswer(): void {
    this.targetQaForAnswer.set(null);
  }

  confirmAnswer(): void {
    const text = this.answerText().trim();
    if (text.length < 5) {
      this.answerError.set('Nội dung trả lời tối thiểu 5 ký tự.');
      return;
    }
    const item = this.targetQaForAnswer();
    if (item) {
      this.submitAnswer.emit({ id: item.id, answer: text });
    }
    this.closeAnswer();
  }
}
