import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'vic-vendor-reject-dialog',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="modal">
      <h2>Từ chối hồ sơ</h2>
      <p class="hint">{{ shop }}</p>
      <textarea
        [formControl]="reason"
        placeholder="Nêu rõ lý do để vendor biết cần sửa gì…"
        maxlength="500"
      ></textarea>
      @if (errorMessage) {
        <div class="err" role="alert">{{ errorMessage }}</div>
      }
      <div class="quick">
        @for (item of quickSuggestions; track item) {
          <button type="button" class="chip" (click)="addSuggestion(item)">{{ item }}</button>
        }
      </div>
      <div class="acts">
        <button class="btn s" type="button" (click)="cancel.emit()">Hủy</button>
        <button class="btn p" type="button" (click)="confirm()">Từ chối hồ sơ</button>
      </div>
    </div>
  `,
  styles: [`
    .modal { padding: 32px; color: var(--color-ink, #000); }
    h2 { margin: 0 0 6px; font-size: 22px; font-weight: 700; color: var(--color-ink, #000); }
    .hint { margin: 0; font-size: 13px; color: var(--color-mute, #62625b); }
    textarea { width: 100%; min-height: 96px; margin: 12px 0 4px; border: 1px solid var(--color-ash, #91918c); border-radius: 16px; padding: 12px 15px; background: var(--color-canvas, #fff); color: var(--color-ink, #000); font-family: inherit; font-size: 14px; resize: vertical; box-sizing: border-box; }
    .err { color: var(--color-error, #9e0a0a); font-size: 13px; min-height: 18px; margin-bottom: 4px; }
    .quick { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .quick .chip { font-size: 13px; padding: 8px 12px; min-height: 36px; border: 0; border-radius: 9999px; background: var(--color-surface-card, #f6f6f3); color: var(--color-ink, #000); font-weight: 700; cursor: pointer; }
    .acts { display: flex; gap: 8px; border: 0; padding-top: 20px; justify-content: flex-end; }
    .btn { border: 0; border-radius: 16px; padding: 14px 22px; font-weight: 700; font-size: 14px; line-height: 1; cursor: pointer; min-height: 44px; }
    .btn.p { background: var(--color-primary, #e60023); color: #fff; }
    .btn.s { background: var(--color-hairline-soft, #e5e5e0); color: var(--color-ink, #000); }
  `],
})
export class RejectDialogComponent {
  @Input() shop = '';
  @Output() confirmed = new EventEmitter<string>();
  @Output() cancel = new EventEmitter<void>();

  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
  });
  readonly quickSuggestions = [
    'Giấy tờ KYC bị mờ',
    'Thông tin không khớp giấy tờ',
    'Tên shop vi phạm chính sách',
    'Thiếu địa chỉ kho',
  ];
  errorMessage = '';

  addSuggestion(text: string): void {
    const cur = this.reason.value.trim();
    this.reason.setValue(cur ? `${cur} ${text}.` : `${text}.`);
    this.errorMessage = '';
  }

  confirm(): void {
    const val = this.reason.value.trim();
    if (val.length < 10) {
      this.errorMessage = 'Nhập lý do từ chối ít nhất 10 ký tự để vendor biết cần sửa gì.';
      return;
    }
    this.confirmed.emit(val);
  }
}
