import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { Shipment } from '../../models/shipper.models';

@Component({
  selector: 'app-confirm-delivery-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'Xác nhận giao thành công'"
      [maxWidth]="'460px'"
      (closed)="onCancel()"
    >
      @if (shipment(); as item) {
        <div class="confirm-delivery-body">
          <div class="status-icon-circle">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p class="order-code-sub">Đơn hàng: <strong>{{ item.code }}</strong></p>

          <div class="info-card">
            <div class="info-row">
              <span class="label">Người nhận:</span>
              <strong class="val">{{ item.customerName }} ({{ item.customerPhone }})</strong>
            </div>
            <div class="info-row">
              <span class="label">Số tiền COD cần thu:</span>
              <strong class="val val--amount">{{ formatCurrency(item.codAmount) }}</strong>
            </div>
            <div class="checkbox-row">
              <input type="checkbox" id="codCheck" [(ngModel)]="isCodConfirmed" />
              <label for="codCheck">Đã nhận đủ tiền mặt hoặc chuyển khoản từ khách hàng</label>
            </div>
          </div>

          <div class="dialog-actions">
            <button type="button" class="btn-cancel" (click)="onCancel()">Hủy bỏ</button>
            <button
              type="button"
              class="btn-confirm"
              [disabled]="item.codAmount > 0 && !isCodConfirmed"
              (click)="onConfirm()"
            >
              Xác nhận hoàn tất
            </button>
          </div>
        </div>
      }
    </app-dialog>
  `,
  styles: [`
    .confirm-delivery-body {
      padding: 8px 0 4px;
      text-align: center;
    }
    .status-icon-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background-color: var(--color-success-pale, #c7f0da);
      color: var(--color-success-deep, #103c25);
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
      margin-bottom: 16px;
      strong {
        color: var(--color-ink, #000000);
      }
    }
    .info-card {
      background-color: var(--color-surface-card, #f6f6f3);
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      margin-bottom: 20px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12.5px;
      margin-bottom: 10px;
      .label {
        color: var(--color-mute, #62625b);
      }
      .val {
        color: var(--color-ink, #000000);
        &--amount {
          font-size: 16px;
          font-weight: 800;
          color: var(--color-primary, #e60023);
        }
      }
    }
    .checkbox-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding-top: 10px;
      border-top: 1px solid var(--color-hairline, #dadad3);
      font-size: 11.5px;
      color: var(--color-mute, #62625b);
      cursor: pointer;
      input {
        cursor: pointer;
        accent-color: var(--color-primary, #e60023);
      }
      label {
        cursor: pointer;
      }
    }
    .dialog-actions {
      display: flex;
      gap: 12px;
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
      .btn-confirm {
        background-color: #059669;
        border: none;
        color: #ffffff;
        &:hover:not(:disabled) {
          background-color: #047857;
        }
        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeliveryDialogComponent {
  readonly open = input<boolean>(false);
  readonly shipment = input<Shipment | null>(null);

  readonly confirmed = output<{ id: number; collectedCod: number }>();
  readonly closed = output<void>();

  isCodConfirmed = true;

  onConfirm(): void {
    const item = this.shipment();
    if (!item) return;
    this.confirmed.emit({ id: item.id, collectedCod: item.codAmount });
  }

  onCancel(): void {
    this.closed.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
