import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { Shipment } from '../../models/shipper.models';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-history',
  standalone: true,
  imports: [CommonModule, ShipmentDetailDialogComponent],
  template: `
    <div class="history-page">
      <div class="page-header">
        <span class="badge-subtitle">LỊCH SỬ GIAO NHẬN (UC103)</span>
        <h1 class="page-title">Nhật ký hoàn thành & sự cố</h1>
        <p class="page-desc">Toàn bộ các vận đơn đã giao thành công hoặc báo cáo giao thất bại chuyển điều phối xử lý.</p>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="history-table">
            <thead>
              <tr>
                <th>Mã Vận Đơn</th>
                <th>Thời Gian Hoàn Tất</th>
                <th>Khách Hàng</th>
                <th>Tiền COD Thu Được</th>
                <th>Kết Quả</th>
                <th>Ghi Chú Sự Kiện</th>
              </tr>
            </thead>
            <tbody>
              @for (item of historyList(); track item.id) {
                <tr class="table-row">
                  <td>
                    <button type="button" class="btn-code" (click)="activeDetailShipment.set(item)">
                      <span>{{ item.code }}</span>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </td>
                  <td class="text-mute">{{ getLastEventTime(item) }}</td>
                  <td class="text-ink-strong">{{ item.customerName }}</td>
                  <td class="text-cod" [class.text-cod--zero]="item.status === 'FAILED'">
                    {{ item.status === 'DELIVERED' ? formatCurrency(item.codAmount) : '0 đ' }}
                  </td>
                  <td>
                    @if (item.status === 'DELIVERED') {
                      <span class="result-badge result-badge--success">Thành công</span>
                    } @else {
                      <span class="result-badge result-badge--fail">Thất bại</span>
                    }
                  </td>
                  <td class="event-desc-cell">
                    {{ getLastEventDesc(item) }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        @if (historyList().length === 0) {
          <div class="empty-state">
            Chưa có lịch sử giao hàng nào trong ca hôm nay.
          </div>
        }
      </div>

      <app-shipment-detail-dialog
        [open]="activeDetailShipment() !== null"
        [shipment]="activeDetailShipment()"
        (closed)="activeDetailShipment.set(null)"
      />
    </div>
  `,
  styles: [`
    .history-page {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .page-header {
      .badge-subtitle {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.8px;
        color: var(--color-primary, #e60023);
        text-transform: uppercase;
      }
      .page-title {
        font-size: 24px;
        font-weight: 800;
        color: var(--color-ink, #000000);
        letter-spacing: -0.5px;
        margin-top: 4px;
      }
      .page-desc {
        font-size: 13.5px;
        color: var(--color-mute, #62625b);
        margin-top: 4px;
      }
    }
    .table-card {
      background-color: #ffffff;
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: var(--rounded-md, 16px);
      overflow: hidden;
    }
    .table-responsive {
      overflow-x: auto;
    }
    .history-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;

      thead th {
        background-color: var(--color-surface-card, #f6f6f3);
        color: var(--color-mute, #62625b);
        text-transform: uppercase;
        font-size: 10.5px;
        font-weight: 800;
        letter-spacing: 0.5px;
        padding: 12px 20px;
        border-bottom: 1px solid var(--color-hairline-soft, #e5e5e0);
      }

      tbody td {
        padding: 14px 20px;
        border-bottom: 1px solid var(--color-hairline-soft, #e5e5e0);
        vertical-align: middle;
      }

      .table-row:hover {
        background-color: rgba(246, 246, 243, 0.7);
      }

      .btn-code {
        background: none;
        border: none;
        padding: 0;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 13px;
        font-weight: 800;
        font-family: inherit;
        color: var(--color-ink, #000000);
        cursor: pointer;
        svg {
          width: 13px;
          height: 13px;
          color: var(--color-mute, #62625b);
        }
        &:hover { color: var(--color-primary, #e60023); }
      }

      .text-mute {
        font-size: 12px;
        color: var(--color-mute, #62625b);
      }

      .text-ink-strong {
        font-size: 12.5px;
        font-weight: 700;
        color: var(--color-ink, #000000);
      }

      .text-cod {
        font-weight: 800;
        color: var(--color-primary, #e60023);
        font-size: 13px;
        &--zero {
          color: var(--color-stone, #c8c8c1);
          text-decoration: line-through;
        }
      }

      .result-badge {
        display: inline-flex;
        padding: 3px 10px;
        border-radius: 9999px;
        font-size: 11px;
        font-weight: 700;
        &--success {
          background-color: #ecfdf5;
          color: #065f46;
        }
        &--fail {
          background-color: #fef2f2;
          color: #991b1b;
        }
      }

      .event-desc-cell {
        font-size: 12px;
        color: var(--color-mute, #62625b);
        max-width: 320px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    .empty-state {
      padding: 36px;
      text-align: center;
      font-size: 13px;
      color: var(--color-mute, #62625b);
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperHistoryComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);

  readonly historyList = signal<Shipment[]>([]);
  readonly activeDetailShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.historyList.set(list.filter((s) => s.status === 'DELIVERED' || s.status === 'FAILED'));
    });
  }

  getLastEventTime(item: Shipment): string {
    const last = item.events[item.events.length - 1];
    return last ? last.time : '--';
  }

  getLastEventDesc(item: Shipment): string {
    const last = item.events[item.events.length - 1];
    return last ? last.title : '--';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
