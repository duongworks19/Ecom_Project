import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import {
  VENDOR_DOCUMENT_CHECKS,
  VendorApplication,
  VendorApprovalService,
} from '../../services/vendor-approval.service';

interface RequestInfoDialogData {
  id: number;
  shop: string;
}

interface DialogResult {
  application?: VendorApplication;
  status?: number;
}

@Component({
  selector: 'vic-request-info-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatInputModule],
  template: `
    <div class="modal" (keydown)="onKeydown($event)">
      <h2>Yêu cầu bổ sung hồ sơ</h2>
      <p class="hint">{{ data.shop }}</p>

      <div class="quick" role="group" aria-label="Mục cần bổ sung">
        @for (item of availableItems; track item) {
          <button
            type="button"
            class="chip"
            [class.active]="isSelected(item)"
            [attr.aria-pressed]="isSelected(item)"
            (click)="toggleItem(item)"
          >
            {{ item }}
          </button>
        }
      </div>

      <textarea
        placeholder="Hướng dẫn cụ thể cho vendor, ví dụ: chụp rõ 4 góc CCCD…"
        maxlength="500"
        [value]="note()"
        (input)="onNoteInput($event)"
      ></textarea>

      @if (error()) {
        <div class="err" role="alert">{{ error() }}</div>
      }

      <p class="hint" style="margin-top: 4px;">
        Hạn bổ sung: 7 ngày. Các mục bạn đã tick được giữ nguyên, khi vendor gửi lại chỉ cần kiểm tra các mục liên quan.
      </p>

      <div class="acts">
        <button class="btn s" type="button" [disabled]="saving()" (click)="dialogRef.close()">
          Hủy
        </button>
        <button class="btn p" type="button" [disabled]="saving()" (click)="submit()">
          {{ saving() ? 'Đang gửi…' : 'Gửi yêu cầu' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal {
      padding: 32px;
      color: var(--color-ink, #000);
    }
    h2 {
      margin: 0 0 6px;
      font-size: 22px;
      font-weight: 700;
      color: var(--color-ink, #000);
    }
    .hint {
      margin: 0;
      font-size: 13px;
      color: var(--color-mute, #62625b);
    }
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 14px 0 0;
    }
    .quick .chip {
      font-size: 13px;
      padding: 8px 12px;
      min-height: 36px;
      border: 0;
      border-radius: 9999px;
      background: var(--color-surface-card, #f6f6f3);
      color: var(--color-ink, #000);
      font-weight: 700;
      cursor: pointer;
    }
    .quick .chip.active,
    .quick .chip[aria-pressed="true"] {
      background: var(--color-chip-on, #000);
      color: var(--color-chip-on-t, #fff);
    }
    textarea {
      width: 100%;
      min-height: 96px;
      margin: 12px 0 4px;
      border: 1px solid var(--color-ash, #91918c);
      border-radius: 16px;
      padding: 12px 15px;
      background: var(--color-canvas, #fff);
      color: var(--color-ink, #000);
      font-family: inherit;
      font-size: 14px;
      resize: vertical;
      box-sizing: border-box;
    }
    textarea:focus {
      outline: 4px solid var(--color-focus, #435ee5);
      border-color: var(--color-ink, #000);
    }
    .err {
      color: var(--color-error, #9e0a0a);
      font-size: 13px;
      min-height: 18px;
    }
    .acts {
      display: flex;
      gap: 8px;
      border: 0;
      padding-top: 20px;
      justify-content: flex-end;
    }
    .btn {
      border: 0;
      border-radius: 16px;
      padding: 14px 22px;
      font-weight: 700;
      font-size: 14px;
      line-height: 1;
      cursor: pointer;
      min-height: 44px;
    }
    .btn.p {
      background: var(--color-primary, #e60023);
      color: #fff;
    }
    .btn.s {
      background: var(--color-hairline-soft, #e5e5e0);
      color: var(--color-ink, #000);
    }
  `],
})
export class RequestInfoDialogComponent {
  readonly data = inject<RequestInfoDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject<MatDialogRef<RequestInfoDialogComponent, DialogResult>>(MatDialogRef);
  private readonly service = inject(VendorApprovalService);

  readonly availableItems = Object.keys(VENDOR_DOCUMENT_CHECKS);
  readonly selectedItems = signal<string[]>([]);
  readonly note = signal('');
  readonly error = signal('');
  readonly saving = signal(false);

  isSelected(item: string): boolean {
    return this.selectedItems().includes(item);
  }

  toggleItem(item: string): void {
    this.selectedItems.update((items) =>
      items.includes(item) ? items.filter((i) => i !== item) : [...items, item]
    );
    this.error.set('');
  }

  onNoteInput(event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLTextAreaElement)) return;
    this.note.set(target.value.slice(0, 500));
    this.error.set('');
  }

  submit(): void {
    const items = this.selectedItems();
    const note = this.note().trim();
    if (!items.length || note.length < 10) {
      this.error.set('Chọn ít nhất một mục cần bổ sung và nhập hướng dẫn tối thiểu 10 ký tự.');
      return;
    }
    this.saving.set(true);
    this.service.requestAdditionalInfo(this.data.id, items, note).subscribe({
      next: (application) => this.dialogRef.close({ application }),
      error: (error: unknown) => this.handleError(error),
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && !this.saving()) this.dialogRef.close();
  }

  private handleError(error: unknown): void {
    this.saving.set(false);
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 404 || status === 409) {
      this.dialogRef.close({ status });
    } else if (status === 403) {
      this.error.set('Bạn không có quyền thực hiện thao tác này.');
    } else if (status === 400 || status === 422) {
      this.error.set('Dữ liệu yêu cầu bổ sung không hợp lệ.');
    } else if (status !== 401) {
      this.error.set('Không thể gửi yêu cầu bổ sung. Vui lòng thử lại.');
    }
  }
}
