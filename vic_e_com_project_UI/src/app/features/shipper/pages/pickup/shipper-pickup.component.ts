import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Shipment } from '../../models/shipper.models';
import { ShipmentDetailDialogComponent } from '../../components/shipment-detail-dialog/shipment-detail-dialog.component';

@Component({
  selector: 'app-shipper-pickup',
  standalone: true,
  imports: [CommonModule, ShipmentDetailDialogComponent],
  template: `
    <div class="pickup-page">
      <div class="page-header">
        <span class="badge-subtitle">QUY TRÌNH LẤY HÀNG (PICKUP - UC98)</span>
        <h1 class="page-title">Đơn hàng cần lấy từ Shop</h1>
        <p class="page-desc">Đến trực tiếp địa chỉ kho/cửa hàng của người bán, kiểm tra kiện hàng và bấm xác nhận lấy.</p>
      </div>

      @if (pickupShipments().length === 0) {
        <div class="empty-card">
          <p>Hiện không có đơn nào đang chờ lấy hàng tại Shop.</p>
        </div>
      } @else {
        <div class="pickup-cards-grid">
          @for (item of pickupShipments(); track item.id) {
            <div class="pickup-card">
              <div class="card-main">
                <div class="card-top-row">
                  <button type="button" class="btn-code" (click)="activeDetailShipment.set(item)">
                    {{ item.code }}
                  </button>
                  <span class="tag-pickup">Cần lấy</span>
                </div>

                <h3 class="vendor-title">{{ item.vendorName }}</h3>
                <div class="vendor-address-row">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span>{{ item.vendorAddress }}</span>
                </div>
                <div class="vendor-phone-row">
                  <span>Liên hệ kho: <strong>{{ item.vendorPhone }}</strong></span>
                </div>

                <div class="package-box">
                  <span class="pkg-label">Nội dung kiện hàng:</span>
                  <strong class="pkg-name">{{ item.itemSummary }}</strong>
                </div>
              </div>

              <div class="card-footer">
                <div class="cod-tag">
                  COD cần thu: <strong>{{ formatCurrency(item.codAmount) }}</strong>
                </div>
                <button type="button" class="btn-confirm-pickup" (click)="onConfirmPickup(item)">
                  Xác nhận đã lấy kiện hàng
                </button>
              </div>
            </div>
          }
        </div>
      }

      <app-shipment-detail-dialog
        [open]="activeDetailShipment() !== null"
        [shipment]="activeDetailShipment()"
        (closed)="activeDetailShipment.set(null)"
      />
    </div>
  `,
  styles: [`
    .pickup-page {
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
    .pickup-cards-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 18px;
    }
    .pickup-card {
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
      .tag-pickup {
        font-size: 11px;
        font-weight: 700;
        background-color: #fef3c7;
        color: #92400e;
        padding: 2px 8px;
        border-radius: 9999px;
      }
    }
    .vendor-title {
      font-size: 14.5px;
      font-weight: 800;
      color: var(--color-ink, #000000);
      margin-bottom: 6px;
    }
    .vendor-address-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: var(--color-mute, #62625b);
      margin-bottom: 4px;
      svg {
        width: 14px;
        height: 14px;
        color: var(--color-stone, #c8c8c1);
        margin-top: 2px;
        flex-shrink: 0;
      }
    }
    .vendor-phone-row {
      font-size: 12px;
      color: var(--color-mute, #62625b);
      margin-bottom: 14px;
      strong { color: var(--color-ink, #000000); }
    }
    .package-box {
      background-color: var(--color-surface-card, #f6f6f3);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 16px;
      .pkg-label {
        display: block;
        font-size: 10.5px;
        color: var(--color-mute, #62625b);
        margin-bottom: 2px;
      }
      .pkg-name {
        font-size: 12.5px;
        color: var(--color-ink, #000000);
      }
    }
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid var(--color-hairline-soft, #e5e5e0);
      padding-top: 14px;
      .cod-tag {
        font-size: 12px;
        color: var(--color-mute, #62625b);
        strong {
          color: var(--color-primary, #e60023);
          font-weight: 800;
        }
      }
      .btn-confirm-pickup {
        padding: 8px 16px;
        border-radius: 10px;
        background-color: #d97706;
        color: #ffffff;
        border: none;
        font-size: 12.5px;
        font-weight: 700;
        cursor: pointer;
        transition: var(--transition-fast, 0.15s ease);
        &:hover {
          background-color: #b45309;
        }
      }
    }
    @media (max-width: 900px) {
      .pickup-cards-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperPickupComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  private readonly toastService = inject(ToastService);

  readonly pickupShipments = signal<Shipment[]>([]);
  readonly activeDetailShipment = signal<Shipment | null>(null);

  ngOnInit(): void {
    this.shipperService.shipments$.subscribe((list) => {
      this.pickupShipments.set(list.filter((s) => s.status === 'READY_TO_PICK'));
    });
  }

  onConfirmPickup(item: Shipment): void {
    this.shipperService.confirmPickup(item.id).subscribe({
      next: (res) => {
        this.toastService.success(`Đã lấy kiện hàng ${res.code} thành công! Đơn chuyển sang đang giao.`);
      },
      error: () => this.toastService.error('Có lỗi xảy ra khi xác nhận lấy hàng'),
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
