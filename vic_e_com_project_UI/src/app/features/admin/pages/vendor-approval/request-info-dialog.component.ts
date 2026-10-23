import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VENDOR_DOCUMENT_CHECKS } from '../../services/vendor-approval.service';

@Component({
  selector: 'vic-request-info-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal">
      <h2>Yêu cầu bổ sung hồ sơ</h2>
      <p class="hint">{{ shop }}</p>

      <div class="quick" role="group" aria-label="Mục cần bổ sung">
        @for (item of availableItems; track item) {
          <button
            type="button"
            class="chip"
            [class.active]="isSelected(item)"
            (click)="toggleItem(item)"
          >
            {{ item }}
          </button>
        }
      </div>

      <textarea
        [(ngModel)]="note"
        placeholder="Hướng dẫn cụ thể cho vendor, ví dụ: chụp rõ 4 góc CCCD…"
        maxlength="500"
      ></textarea>

      @if (errorMessage) {
        <div class="err" role="alert">{{ errorMessage }}</div>
      }

      <div class="acts">
        <button class="btn s" type="button" (click)="cancel.emit()">Hủy</button>
        <button class="btn p" type="button" (click)="confirm()">Gửi yêu cầu</button>
      </div>
    </div>
  `,
  styles: [`
    .modal { padding: 32px; color: var(--color-ink, #000); }
    h2 { margin: 0 0 6px; font-size: 22px; font-weight: 700; color: var(--color-ink, #000); }
    .hint { margin: 0; font-size: 13px; color: var(--color-mute, #62625b); }
    .quick { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
    .chip { font-size: 13px; padding: 8px 12px; min-height: 36px; border: 0; border-radius: 9999px; background: var(--color-surface-card, #f6f6f3); color: var(--color-ink, #000); font-weight: 600; cursor: pointer; }
    .chip.active { background: var(--color-ink, #000); color: #fff; }
    textarea { width: 100%; min-height: 96px; margin: 8px 0; border: 1px solid var(--color-ash, #91918c); border-radius: 16px; padding: 12px 15px; font-family: inherit; font-size: 14px; box-sizing: border-box; }
    .err { color: var(--color-error, #9e0a0a); font-size: 13px; margin-bottom: 4px; }
    .acts { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; }
    .btn { border: 0; border-radius: 16px; padding: 14px 22px; font-weight: 700; font-size: 14px; cursor: pointer; }
    .btn.p { background: var(--color-primary, #e60023); color: #fff; }
    .btn.s { background: var(--color-hairline-soft, #e5e5e0); color: var(--color-ink, #000); }
  `],
})
export class RequestInfoDialogComponent {
  @Input() shop = '';
  @Output() confirmed = new EventEmitter<{ items: string[]; note: string }>();
  @Output() cancel = new EventEmitter<void>();

  readonly availableItems = Object.keys(VENDOR_DOCUMENT_CHECKS);
  readonly selectedItems = signal<string[]>([]);
  note = '';
  errorMessage = '';

  isSelected(item: string): boolean {
    return this.selectedItems().includes(item);
  }

  toggleItem(item: string): void {
    this.selectedItems.update((items) =>
      items.includes(item) ? items.filter((i) => i !== item) : [...items, item]
    );
    this.errorMessage = '';
  }

  confirm(): void {
    const trimmed = this.note.trim();
    if (!this.selectedItems().length) {
      this.errorMessage = 'Vui lòng chọn ít nhất 1 mục cần bổ sung.';
      return;
    }
    if (trimmed.length < 10) {
      this.errorMessage = 'Hướng dẫn cần tối thiểu 10 ký tự.';
      return;
    }
    this.confirmed.emit({ items: this.selectedItems(), note: trimmed });
  }
}
