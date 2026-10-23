import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { FailureReason, Shipment } from '../../models/shipper.models';
import { ConfirmDeliveryDialogComponent } from '../../components/confirm-delivery-dialog/confirm-delivery-dialog.component';
import { ReportFailureDialogComponent } from '../../components/report-failure-dialog/report-failure-dialog.component';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-delivering',
  standalone: true,
  imports: [
    CommonModule,
    ConfirmDeliveryDialogComponent,
    ReportFailureDialogComponent,
    ShipmentDetailDialogComponent,
  ],
  template: `
    <div class="delivering-page">
      <div class="page-header">
        <span class="badge-subtitle">ĐANG TRÊN ĐƯỜNG GIAO (DELIVERING - UC99, UC100, UC101, UC102)</span>
        <h1 class="page-title">Đơn hàng đang phát cho khách</h1>
        <p class="page-desc">Liên hệ trực tiếp với người nhận, tiến hành thu tiền COD hoặc ghi nhận sự cố giao thất bại.</p>
      </div>

      @if (deliveringShipments().length === 0) {
        <div class="empty-card">
          <p>Hiện bạn không có đơn nào đang trên đường giao.</p>
        </div>
      } @else {
        <div class="delivering-cards-grid">
          @for (item of deliveringShipments(); track item.id) {
            <div class="delivering-card">
              <div class="card-main">
                <div class="card-top-row">
                  <button type="button" class="btn-code" (click)="activeDetailShipment.set(item)">
                    {{ item.code }}
                  </button>
                  <span class="tag-delivering">Đang giao</span>
                </div>

                <h3 class="customer-title">{{ item.customerName }} - {{ item.customerPhone }}</h3>
                <div class="customer-address-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{{ item.customerAddress }}</span>
                </div>

                <div class="pkg-cod-box">
                  <div class="pkg-info">
                    <span class="box-lbl">Sản phẩm:</span>
                    <strong class="box-val">{{ item.itemSummary }}</strong>
                  </div>
                  <div class="cod-info">
                    <span class="box-lbl">Tiền thu COD:</span>
                    <span class="cod-amount">{{ formatCurrency(item.codAmount) }}</span>
                  </div>
                </div>
              </div>

              <div class="card-footer">
                <button type="button" class="btn-deliver-success" (click)="activeDeliveryShipment.set(item)">
                  Giao thành công & Thu COD
                </button>
                <button type="button" class="btn-report-fail" (click)="activeFailureShipment.set(item)">
                  Báo thất bại
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Dialogs -->
      <app-confirm-delivery-dialog
        [open]="activeDeliveryShipment() !== null"
        [shipment]="activeDeliveryShipment()"
        (confirmed)="handleDeliveryConfirmed($event)"
        (closed)="activeDeliveryShipment.set(null)"
      />

      <app-report-failure-dialog
        [open]="activeFailureShipment() !== null"
        [shipment]="activeFailureShipment()"
        (reported)="handleFailureReported($event)"
        (closed)="activeFailureShipment.set(null)"
      />

      <app-shipment-detail-dialog
        [open]="activeDetailShipment() !== null"
        [shipment]="activeDetailShipment()"
        (closed)="activeDetailShipment.set(null)"
      />
    </div>
  `,
  styles: [`
    .delivering-page {
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
    .empty-card {
      background-color: #ffffff;
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: var(--rounded-md, 16px);
      padding: 40px;
      text-align: center;
      font-size: 13px;
      color: var(--color-mute, #62625b);
    }
    .delivering-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }
    .delivering-card {
      background-color: #ffffff;
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: var(--rounded-md, 16px);
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .card-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      .btn-code {
        background: none;
        border: none;
        padding: 0;
        font-size: 13px;
        font-weight: 800;
        font-family: inherit;
        color: var(--color-primary, #e60023);
        cursor: pointer;
        &:hover { text-decoration: underline; }
      }
      .tag-delivering {
        font-size: 11px;
        font-weight: 700;
        background-color: #dbeafe;
        color: #1e40af;
        padding: 2px 8px;
        border-radius: 9999px;
      }
    }
    .customer-title {
      font-size: 14.5px;
      font-weight: 800;
      color: var(--color-ink, #000000);
      margin-bottom: 6px;
    }
    .customer-address-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: var(--color-mute, #62625b);
      margin-bottom: 14px;
      svg {
        width: 14px;
        height: 14px;
        color: var(--color-stone, #c8c8c1);
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
    .pkg-cod-box {
      background-color: var(--color-surface-card, #f6f6f3);
      border-radius: 10px;
      padding: 12px 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      .box-lbl {
        display: block;
        font-size: 10.5px;
        color: var(--color-mute, #62625b);
        margin-bottom: 2px;
      }
      .box-val {
        font-size: 12.5px;
        color: var(--color-ink, #000000);
      }
      .cod-amount {
        font-size: 15px;
        font-weight: 800;
        color: var(--color-primary, #e60023);
      }
    }
    .card-footer {
      display: flex;
      align-items: center;
      gap: 10px;
      border-top: 1px solid var(--color-hairline-soft, #e5e5e0);
      padding-top: 14px;
      .btn-deliver-success {
        flex: 1;
        padding: 9px 0;
        border-radius: 10px;
        background-color: #059669;
        color: #ffffff;
        border: none;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition-fast, 0.15s ease);
        &:hover {
          background-color: #047857;
        }
      }
      .btn-report-fail {
        padding: 9px 14px;
        border-radius: 10px;
        background-color: #ffffff;
        border: 1px solid var(--color-hairline, #dadad3);
        color: var(--color-primary, #e60023);
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition-fast, 0.15s ease);
        &:hover {
          background-color: #fee2e2;
        }
      }
    }
    @media (max-width: 900px) {
      .delivering-cards-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperDeliveringComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  private readonly toastService = inject(ToastService);

  readonly deliveringShipments = signal<Shipment[]>([]);
  readonly activeDetailShipment = signal<Shipment | null>(null);
  readonly activeDeliveryShipment = signal<Shipment | null>(null);
  readonly activeFailureShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.deliveringShipments.set(list.filter((s) => s.status === 'DELIVERING'));
    });
  }

  handleDeliveryConfirmed(event: { id: number; collectedCod: number }): void {
    this.shipperService.confirmDelivered(event.id, event.collectedCod).subscribe({
      next: (res) => {
        this.activeDeliveryShipment.set(null);
        this.toastService.success(`Đã giao đơn ${res.code} thành công! COD: ${this.formatCurrency(event.collectedCod)}`);
      },
      error: () => this.toastService.error('Có lỗi xảy ra khi xác nhận giao hàng'),
    });
  }

  handleFailureReported(event: { id: number; reason: FailureReason; notes: string }): void {
    this.shipperService.reportDeliveryFailure(event.id, event.reason, event.notes).subscribe({
      next: (res) => {
        this.activeFailureShipment.set(null);
        this.toastService.info(`Đã báo sự cố giao thất bại đơn ${res.code}. Vụ việc đã được chuyển điều phối.`);
      },
      error: () => this.toastService.error('Có lỗi khi báo sự cố'),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
