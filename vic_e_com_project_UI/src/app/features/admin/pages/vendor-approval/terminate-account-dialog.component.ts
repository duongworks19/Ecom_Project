import { Component, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface TerminateDialogData {
  id: number;
  shop: string;
  owner: string;
}

export interface TerminateResult {
  violationType: string;
  reason: string;
}

@Component({
  selector: 'vic-terminate-account-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="modal" (keydown)="onKeydown($event)">
      <div class="header-danger">
        <span class="warning-icon">⚠️</span>
        <h2>Xóa tài khoản shop vi phạm</h2>
      </div>
      <p class="hint">
        Shop: <strong>{{ data.shop }}</strong> · Chủ tài khoản: <strong>{{ data.owner }}</strong>
      </p>

      <div class="danger-box">
        <strong>CẢNH BÁO:</strong> Thao tác này sẽ xóa vĩnh viễn quyền người bán, vô hiệu hóa tài khoản người dùng, ẩn toàn bộ sản phẩm của gian hàng và đăng xuất cưỡng bức shop khỏi mọi thiết bị.
      </div>

      <label class="section-label">Loại vi phạm quy định cấm:</label>
      <div class="quick" role="group" aria-label="Loại vi phạm">
        @for (item of violationTypes; track item) {
          <button
            type="button"
            class="chip"
            [class.active]="selectedViolation() === item"
            [attr.aria-pressed]="selectedViolation() === item"
            (click)="selectViolation(item)"
          >
            {{ item }}
          </button>
        }
      </div>

      <label class="section-label" style="margin-top: 14px;">Mô tả chi tiết vi phạm & căn cứ xử lý:</label>
      <textarea
        [formControl]="reason"
        placeholder="Ghi rõ hành vi vi phạm (ví dụ: phát hiện bán hàng nhái thương hiệu X, kinh doanh sản phẩm cấm theo nghị định...)"
        maxlength="500"
      ></textarea>

      @if (errorMessage()) {
        <div class="err" role="alert">{{ errorMessage() }}</div>
      }

      <div class="acts">
        <button class="btn s" type="button" (click)="dialogRef.close()">Hủy</button>
        <button class="btn danger" type="button" (click)="confirm()">Xác nhận xóa tài khoản</button>
      </div>
    </div>
  `,
  styles: [`
    .modal {
      padding: 32px;
      color: var(--color-ink, #000);
    }
    .header-danger {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .warning-icon {
      font-size: 24px;
    }
    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      color: var(--color-error, #9e0a0a);
    }
    .hint {
      margin: 0 0 16px;
      font-size: 13px;
      color: var(--color-mute, #62625b);
    }
    .danger-box {
      background: var(--err-bg, #fbe3e3);
      border: 1px solid var(--err, #9e0a0a);
      color: var(--err, #9e0a0a);
      border-radius: 12px;
      padding: 12px 16px;
      font-size: 13px;
      line-height: 1.45;
      margin-bottom: 18px;
    }
    .section-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: var(--color-ink, #000);
      margin-bottom: 6px;
    }
    .quick {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .quick .chip {
      font-size: 13px;
      padding: 8px 12px;
      min-height: 36px;
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: 9999px;
      background: var(--color-surface-card, #f6f6f3);
      color: var(--color-ink, #000);
      font-weight: 600;
      cursor: pointer;
    }
    .quick .chip.active {
      background: var(--color-error, #9e0a0a);
      border-color: var(--color-error, #9e0a0a);
      color: #fff;
    }
    textarea {
      width: 100%;
      min-height: 96px;
      margin: 4px 0 4px;
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
      margin-top: 4px;
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
    .btn.s {
      background: var(--color-hairline-soft, #e5e5e0);
      color: var(--color-ink, #000);
    }
    .btn.danger {
      background: var(--color-error, #9e0a0a);
      color: #fff;
    }
    .btn.danger:hover {
      background: #7d0808;
    }
  `],
})
export class TerminateAccountDialogComponent {
  readonly data = inject<TerminateDialogData>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<TerminateAccountDialogComponent, TerminateResult>);

  readonly violationTypes = [
    'Bán hàng giả / hàng nhái',
    'Kinh doanh mặt hàng cấm',
    'Lừa đảo / gian lận thương mại',
    'Xâm phạm sở hữu trí tuệ',
    'Vi phạm đạo đức / gian lận đánh giá',
  ];

  readonly selectedViolation = signal<string>(this.violationTypes[0]);
  readonly reason = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10), Validators.maxLength(500)],
  });
  readonly errorMessage = signal('');

  selectViolation(type: string): void {
    this.selectedViolation.set(type);
    this.errorMessage.set('');
  }

  confirm(): void {
    const val = this.reason.value.trim();
    if (val.length < 10) {
      this.errorMessage.set('Vui lòng nhập chi tiết vi phạm tối thiểu 10 ký tự.');
      return;
    }
    this.dialogRef.close({
      violationType: this.selectedViolation(),
      reason: val,
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.dialogRef.close();
  }
}
