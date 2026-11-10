import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { CampaignItem } from '../../models/seller-dashboard.model';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';

@Component({
  selector: 'app-seller-campaigns',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-campaigns.component.html',
  styleUrl: './seller-campaigns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerCampaignsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  readonly store = inject(SellerDashboardStore);
  private readonly API_URL = `${environment.apiUrl}/seller/campaigns`;

  readonly campaigns = this.store.campaigns;

  ngOnInit(): void {
    this.loadCampaigns();
  }

  loadCampaigns(): void {
    this.http.get<{ data?: any[] }>(this.API_URL).subscribe({
      next: (res) => {
        const raw = res?.data || (Array.isArray(res) ? res : []);
        this.store.setCampaigns(raw);
      },
      error: () => {
        this.store.setCampaigns([]);
      },
    });
  }

  toggleStatus(campaign: CampaignItem): void {
    const nextStatus = campaign.st === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    this.http
      .patch(`${this.API_URL}/${campaign.id}/status`, { status: nextStatus })
      .subscribe({
        next: () => {
          this.campaigns.update((list) =>
            list.map((c) => (c.id === campaign.id ? { ...c, st: nextStatus } : c))
          );
          this.store.showToast(
            nextStatus === 'ACTIVE'
              ? `▶️ Đã kích hoạt chiến dịch "${campaign.n}".`
              : `⏸️ Đã tạm dừng chiến dịch "${campaign.n}".`
          );
        },
        error: () => {
          this.store.showToast('Không thể cập nhật trạng thái chiến dịch.', true);
        },
      });
  }

  deleteCampaign(campaign: CampaignItem): void {
    if (!confirm(`Bạn có chắc muốn xóa chương trình "${campaign.n}"?`)) return;
    this.http.delete(`${this.API_URL}/${campaign.id}`).subscribe({
      next: () => {
        this.campaigns.update((list) => list.filter((c) => c.id !== campaign.id));
        this.store.showToast(`🗑️ Đã xóa chương trình "${campaign.n}".`);
      },
      error: () => {
        this.store.showToast('Không thể xóa chương trình giảm giá.', true);
      },
    });
  }
}
