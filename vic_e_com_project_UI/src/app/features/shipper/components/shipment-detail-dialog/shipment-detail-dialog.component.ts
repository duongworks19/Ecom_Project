import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { Shipment } from '../../models/shipper.models';

@Component({
  selector: 'app-shipment-detail-dialog',
  standalone: true,
  imports: [CommonModule, DialogComponent],
  template: `
    <app-dialog
      [open]="open()"
      [title]="'Chi tiết vận đơn: ' + (shipment()?.code || '')"
      [maxWidth]="'620px'"
      (closed)="onClose()"
    >
      @if (shipment(); as item) {
        <div class="shipment-detail-body">
          <!-- Summary Cards -->
          <div class="info-grid">
            <div class="info-block">
              <span class="block-label">Kiện hàng & Sản phẩm</span>
              <div class="block-val">{{ item.itemSummary }}</div>
              <div class="block-sub">Khối lượng: {{ item.packageWeightKg || 0.5 }} kg • Gói hàng tiêu chuẩn</div>
            </div>
            <div class="info-block">
              <span class="block-label">Thu hộ COD & Cước</span>
              <div class="block-val block-val--cod">{{ formatCurrency(item.codAmount) }}</div>
              <div class="block-sub">Phương thức: Thu tiền mặt khi nhận hàng (COD)</div>
            </div>
          </div>

          <!-- 2 Addresses -->
          <div class="address-container">
            <div class="address-card address-card--vendor">
              <div class="address-type-label">
                <span class="type-dot"></span>
                <span>Điểm lấy hàng (Kho/Shop Vendor)</span>
              </div>
              <div class="address-title">{{ item.vendorName }}</div>
              <div class="address-detail">{{ item.vendorAddress }} • SĐT: {{ item.vendorPhone }}</div>
            </div>

            <div class="address-card address-card--customer">
              <div class="address-type-label">
                <span class="type-dot"></span>
                <span>Điểm giao hàng (Khách hàng)</span>
              </div>
              <div class="address-title">{{ item.customerName }} — SĐT: {{ item.customerPhone }}</div>
              <div class="address-detail">{{ item.customerAddress }}</div>
            </div>
          </div>

          <!-- Events Timeline (shipment_events) -->
          <div class="timeline-section">
            <h4 class="timeline-title">Lịch trình sự kiện vận đơn (shipment_events):</h4>
            <div class="timeline-list">
              @for (ev of item.events; track ev.id) {
                <div class="timeline-item">
                  <div class="timeline-marker"></div>
                  <div class="timeline-time">{{ ev.time }}</div>
                  <div class="timeline-desc">{{ ev.title }}</div>
                </div>
              }
            </div>
          </div>

          <div class="dialog-footer">
            <button type="button" class="btn-close" (click)="onClose()">Đóng cửa sổ</button>
          </div>
        </div>
      }
    </app-dialog>
  `,
  styles: [`
    .shipment-detail-body {
      padding: 4px 0;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .info-block {
      background-color: var(--color-surface-card, #f6f6f3);
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: 12px;
      padding: 14px;
      .block-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--color-mute, #62625b);
        display: block;
        margin-bottom: 4px;
      }
      .block-val {
        font-size: 13.5px;
        font-weight: 700;
        color: var(--color-ink, #000000);
        margin-bottom: 4px;
        &--cod {
          font-size: 16px;
          color: var(--color-primary, #e60023);
        }
      }
      .block-sub {
        font-size: 11px;
        color: var(--color-mute, #62625b);
      }
    }
    .address-container {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 20px;
    }
    .address-card {
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: 12px;
      padding: 12px 14px;
      .address-type-label {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 4px;
        .type-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
      }
      &--vendor {
        background-color: #fffbeb;
        border-color: #fef3c7;
        .address-type-label {
          color: #b45309;
          .type-dot { background-color: #d97706; }
        }
      }
      &--customer {
        background-color: #eff6ff;
        border-color: #dbeafe;
        .address-type-label {
          color: #1d4ed8;
          .type-dot { background-color: #2563eb; }
        }
      }
      .address-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--color-ink, #000000);
        margin-bottom: 2px;
      }
      .address-detail {
        font-size: 12px;
        color: var(--color-mute, #62625b);
      }
    }
    .timeline-section {
      border-top: 1px solid var(--color-hairline-soft, #e5e5e0);
      padding-top: 16px;
      margin-bottom: 20px;
      .timeline-title {
        font-size: 12px;
        font-weight: 700;
        text-transform: uppercase;
        color: var(--color-ink, #000000);
        margin-bottom: 12px;
      }
      .timeline-list {
        border-left: 2px solid var(--color-hairline-soft, #e5e5e0);
        margin-left: 8px;
        padding-left: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .timeline-item {
        position: relative;
        .timeline-marker {
          position: absolute;
          left: -21px;
          top: 3px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--color-primary, #e60023);
          border: 2px solid #ffffff;
        }
        .timeline-time {
          font-size: 11px;
          font-weight: 700;
          color: var(--color-mute, #62625b);
        }
        .timeline-desc {
          font-size: 12.5px;
          color: var(--color-ink, #000000);
          font-weight: 500;
        }
      }
    }
    .dialog-footer {
      display: flex;
      justify-content: flex-end;
      .btn-close {
        padding: 9px 20px;
        border-radius: 10px;
        background-color: var(--color-charcoal, #262622);
        color: #ffffff;
        border: none;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        &:hover {
          background-color: var(--color-ink, #000000);
        }
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetailDialogComponent {
  readonly open = input<boolean>(false);
  readonly shipment = input<Shipment | null>(null);

  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
