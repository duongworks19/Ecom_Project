import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { ShipperProfile } from '../../models/shipper.models';

@Component({
  selector: 'app-shipper-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <span class="badge-subtitle">THÔNG TIN TÀI KHOẢN (UC93)</span>
        <h1 class="page-title">Hồ sơ Shipper đối tác</h1>
        <p class="page-desc">Dữ liệu được xác thực bởi VICMART & đối tác vận tải An Phát Logistics.</p>
      </div>

      @if (profile(); as prof) {
        <div class="profile-grid">
          <!-- Col 1: Identity Card -->
          <div class="identity-card">
            <div class="avatar-large">MA</div>
            <h2 class="shipper-name">{{ prof.fullName }}</h2>
            <p class="shipper-email">{{ prof.email }}</p>

            <div class="status-pill-row">
              <span class="status-pill">
                <span class="dot"></span>
                <span>{{ prof.workStatus === 'AVAILABLE' ? 'Đang hoạt động' : 'Tạm nghỉ nhận ca' }}</span>
              </span>
            </div>

            <div class="identity-info-list">
              <div class="info-line">
                <span class="label">Mã nhân viên:</span>
                <strong class="val">{{ prof.shipperCode }}</strong>
              </div>
              <div class="info-line">
                <span class="label">Đơn vị quản lý:</span>
                <strong class="val">{{ prof.partnerCompany }}</strong>
              </div>
              <div class="info-line">
                <span class="label">Ngày tham gia:</span>
                <strong class="val">{{ prof.joinedDate }}</strong>
              </div>
              <div class="info-line">
                <span class="label">Điểm uy tín:</span>
                <strong class="val val--rating">{{ prof.rating }} / 5.0 ★</strong>
              </div>
            </div>
          </div>

          <!-- Col 2: Vehicle & Security Details -->
          <div class="details-column">
            <!-- Box 1: Vehicle & Operating Hub -->
            <div class="detail-box">
              <h3 class="detail-box-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Thông tin phương tiện & khu vực</span>
              </h3>

              <div class="tiles-grid">
                <div class="tile">
                  <span class="tile-label">Loại phương tiện</span>
                  <div class="tile-val">{{ prof.vehicleType }}</div>
                </div>
                <div class="tile">
                  <span class="tile-label">Biển số xe</span>
                  <div class="tile-val">{{ prof.licensePlate }}</div>
                </div>
                <div class="tile">
                  <span class="tile-label">Khu vực tuyến chính</span>
                  <div class="tile-val">{{ prof.serviceArea }}</div>
                </div>
                <div class="tile">
                  <span class="tile-label">Bưu cục trực thuộc</span>
                  <div class="tile-val">{{ prof.hubName }}</div>
                </div>
              </div>
            </div>

            <!-- Box 2: Privacy & Role Specs -->
            <div class="detail-box">
              <h3 class="detail-box-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shield-icon">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Bảo mật & Quyền hạn (Role SHIPPER)</span>
              </h3>
              <p class="role-desc">
                Tài khoản được phân quyền theo đúng tiêu chuẩn an toàn thông tin: Chỉ hiển thị số điện thoại khách hàng cho những đơn đang vận chuyển thực tế. Các thao tác giao thành công hoặc báo hỏng đều được lưu vết kiểm toán (audit log) vào bảng <code class="code-tag">shipment_events</code>.
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .profile-page {
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
    .profile-grid {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 24px;
    }
    .identity-card {
      background-color: #ffffff;
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: var(--rounded-md, 16px);
      padding: 28px 24px;
      text-align: center;
      .avatar-large {
        width: 88px;
        height: 88px;
        border-radius: 50%;
        background-color: var(--color-charcoal, #262622);
        color: #ffffff;
        font-size: 28px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 16px;
        border: 4px solid var(--color-surface-card, #f6f6f3);
      }
      .shipper-name {
        font-size: 17px;
        font-weight: 800;
        color: var(--color-ink, #000000);
      }
      .shipper-email {
        font-size: 12px;
        color: var(--color-mute, #62625b);
        margin-top: 2px;
      }
      .status-pill-row {
        margin: 14px 0 20px;
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          background-color: #ecfdf5;
          color: #065f46;
          font-size: 11.5px;
          font-weight: 700;
          .dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background-color: #10b981;
          }
        }
      }
      .identity-info-list {
        border-top: 1px solid var(--color-hairline-soft, #e5e5e0);
        padding-top: 18px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        text-align: left;
        font-size: 12.5px;
        .info-line {
          display: flex;
          justify-content: space-between;
          .label { color: var(--color-mute, #62625b); }
          .val {
            color: var(--color-ink, #000000);
            &--rating { color: #047857; }
          }
        }
      }
    }
    .details-column {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .detail-box {
      background-color: #ffffff;
      border: 1px solid var(--color-hairline-soft, #e5e5e0);
      border-radius: var(--rounded-md, 16px);
      padding: 24px;
      .detail-box-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13.5px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: var(--color-ink, #000000);
        margin-bottom: 18px;
        svg {
          width: 20px;
          height: 20px;
          color: var(--color-primary, #e60023);
          &.shield-icon { color: #059669; }
        }
      }
      .tiles-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        .tile {
          background-color: var(--color-surface-card, #f6f6f3);
          border-radius: 12px;
          padding: 14px;
          .tile-label {
            display: block;
            font-size: 11px;
            color: var(--color-mute, #62625b);
            margin-bottom: 4px;
          }
          .tile-val {
            font-size: 13px;
            font-weight: 700;
            color: var(--color-ink, #000000);
          }
        }
      }
      .role-desc {
        font-size: 13px;
        color: var(--color-mute, #62625b);
        line-height: 1.6;
        .code-tag {
          font-family: monospace;
          background-color: var(--color-surface-card, #f6f6f3);
          color: var(--color-primary, #e60023);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
      }
    }
    @media (max-width: 900px) {
      .profile-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperProfileComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  readonly profile = signal<ShipperProfile | null>(null);

  ngOnInit(): void {
    this.shipperService.profile$.subscribe((prof) => {
      this.profile.set(prof);
    });
  }
}
