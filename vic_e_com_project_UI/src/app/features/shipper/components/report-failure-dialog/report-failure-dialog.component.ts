import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { FailureReason, Shipment } from '../../models/shipper.models';

@Component({
  selector: 'app-report-failure-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'Báo cáo giao hàng thất bại'"
      [maxWidth]="'480px'"
      (closed)="onCancel()"
    >
      @if (shipment(); as item) {
        <div class="failure-dialog-body">
          <div class="warning-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p class="order-code-sub">
            Vận đơn: <strong>{{ item.code }}</strong>. Sự cố sẽ được chuyển về Admin điều phối trạm.
          </p>

          <div class="form-group">
            <label class="form-label" for="reasonSelect">Lý do thất bại (failure_reason):</label>
            <select id="reasonSelect" [(ngModel)]="selectedReason" class="select-input">
              <option value="CUSTOMER_UNREACHABLE">Khách không nghe máy (Gọi quá 3 lần)</option>
              <option value="WRONG_ADDRESS">Sai thông tin địa chỉ / Không tìm thấy số nhà</option>
              <option value="CUSTOMER_RESCHEDULED">Khách hẹn lại ngày/giờ giao khác</option>
              <option value="CUSTOMER_REJECTED">Khách từ chối nhận hàng (Không ưng ý / Đã hủy)</option>
              <option value="GOODS_DAMAGED">Hàng hóa bị rách / hư hỏng trong quá trình vận chuyển</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" for="notesTextarea">Ghi chú cụ thể:</label>
            <textarea
              id="notesTextarea"
              [(ngModel)]="notes"
              rows="3"
              placeholder="Ví dụ: Đã gọi lúc 14:15 và 14:30 nhưng thuê bao không liên lạc được..."
              class="textarea-input"
            ></textarea>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-cancel" (click)="onCancel()">Hủy bỏ</button>
            <button type="button" class="btn-report" (click)="onReport()">Gửi báo cáo sự cố</button>
          </div>
        </div>
      }
    </app-dialog>
  `,
  styles: [`
    .failure-dialog-body {
      padding: 8px 0 4px;
      text-align: center;
    }
    .warning-icon-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background-color: #fee2e2;
      color: var(--color-primary, #e60023);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      svg {
        width: 28px;
        height: 28px;
      }
    }
    .order-code-sub {
      font-size: 13px;
      color: var(--color-mute, #62625b);
      margin-bottom: 20px;
      strong {
        color: var(--color-ink, #000000);
      }
    }
    .form-group {
      text-align: left;
      margin-bottom: 16px;
      .form-label {
        display: block;
        font-size: 12px;
        font-weight: 700;
        color: var(--color-ink, #000000);
        margin-bottom: 6px;
      }
      .select-input,
      .textarea-input {
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        border: 1px solid var(--color-hairline, #dadad3);
        background-color: #ffffff;
        font-size: 13px;
        color: var(--color-ink, #000000);
        outline: none;
        box-sizing: border-box;
        &:focus {
          border-color: var(--color-primary, #e60023);
        }
      }
      .textarea-input {
        resize: vertical;
        font-family: inherit;
      }
    }
    .dialog-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
      button {
        flex: 1;
        padding: 11px 0;
        border-radius: 10px;
        font-size: 13px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition-fast, 0.15s ease);
      }
      .btn-cancel {
        background-color: transparent;
        border: 1px solid var(--color-hairline, #dadad3);
        color: var(--color-mute, #62625b);
        &:hover {
          background-color: var(--color-surface-card, #f6f6f3);
          color: var(--color-ink, #000000);
        }
      }
      .btn-report {
        background-color: var(--color-primary, #e60023);
        border: none;
        color: #ffffff;
        &:hover {
          background-color: var(--color-primary-pressed, #cc001f);
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFailureDialogComponent {
  readonly open = input<boolean>(false);
  readonly shipment = input<Shipment | null>(null);

  readonly reported = output<{ id: number; reason: FailureReason; notes: string }>();
  readonly closed = output<void>();

  selectedReason: FailureReason = 'CUSTOMER_UNREACHABLE';
  notes = '';

  onReport(): void {
    const item = this.shipment();
    if (!item) return;
    this.reported.emit({
      id: item.id,
      reason: this.selectedReason,
      notes: this.notes.trim() || 'Khách không nhận đơn',
    });
    this.notes = '';
  }

  onCancel(): void {
    this.notes = '';
    this.closed.emit();
  }
}
