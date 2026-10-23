import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

export interface TerminateResult {
  violationType: string;
  reason: string;
}

@Component({
  selector: 'vic-terminate-account-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal">
      <div class="header-danger">
        <span class="warning-icon">⚠️</span>
        <h2>Xóa tài khoản shop vi phạm</h2>
      </div>
      <p class="hint">
        Shop: <strong>{{ shop }}</strong> · Chủ tài khoản: <strong>{{ owner }}</strong>
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
            (click)="selectViolation(item)"
          >
            {{ item }}
          </button>
        }
      </div>

      <label class="section-label" style="margin-top: 14px;">Mô tả chi tiết vi phạm & căn cứ xử lý:</label>
      <textarea
        [formControl]="reason"
        placeholder="Ghi rõ hành vi vi phạm…"
        maxlength="500"
      ></textarea>

      @if (errorMessage()) {
        <div class="err" role="alert">{{ errorMessage() }}</div>
      }

      <div class="acts">
        <button class="btn s" type="button" (click)="cancel.emit()">Hủy</button>
        <button class="btn danger" type="button" (click)="confirm()">Xác nhận xóa tài khoản vĩnh viễn</button>
      </div>
    </div>
  `,
  styles: [`
    .modal { padding: 32px; color: var(--color-ink, #000); }
    .header-danger { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
    .header-danger h2 { margin: 0; font-size: 22px; font-weight: 700; color: #b70c0c; }
    .hint { margin: 0; font-size: 13px; color: var(--color-mute, #62625b); }
    .danger-box { margin: 16px 0; padding: 12px 16px; background: #fff1f0; border: 1px solid #ffccc7; border-radius: 12px; color: #cf1322; font-size: 13px; line-height: 1.5; }
    .section-label { display: block; font-size: 13px; font-weight: 700; color: var(--color-ink, #000); margin-bottom: 8px; }
    .quick { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
    .chip { font-size: 13px; padding: 8px 12px; min-height: 36px; border: 1px solid #d9d9d9; border-radius: 9999px; background: #fff; cursor: pointer; }
    .chip.active { background: #cf1322; color: #fff; border-color: #cf1322; }
    textarea { width: 100%; min-height: 80px; padding: 10px 14px; border: 1px solid #d9d9d9; border-radius: 12px; font-family: inherit; font-size: 14px; box-sizing: border-box; }
    .err { color: #cf1322; font-size: 13px; margin-top: 4px; }
    .acts { display: flex; gap: 8px; justify-content: flex-end; padding-top: 16px; }
    .btn { border: 0; border-radius: 16px; padding: 12px 20px; font-weight: 700; font-size: 14px; cursor: pointer; }
    .btn.s { background: #f0f0f0; }
    .btn.danger { background: #cf1322; color: #fff; }
  `],
})
export class TerminateAccountDialogComponent {
  @Input() shop = '';
  @Input() owner = '';
  @Output() confirmed = new EventEmitter<TerminateResult>();
  @Output() cancel = new EventEmitter<void>();

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
    this.confirmed.emit({
      violationType: this.selectedViolation(),
      reason: val,
    });
  }
}
