import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CampaignItem } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-campaigns',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-campaigns.component.html',
  styleUrl: './seller-campaigns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerCampaignsComponent {
  readonly campaigns = signal<CampaignItem[]>([
    { id: 1, n: 'Flash sale 21.10', t: 'Flash sale', from: '2026-10-21', to: '2026-10-23', dt: '%', val: 15, quota: 50, k: 3, st: 'ACTIVE' },
    { id: 2, n: 'Combo trang trí phòng khách', t: 'Combo / mua kèm', from: '2026-10-01', to: '2026-10-10', dt: '%', val: 10, quota: 100, k: 2, st: 'ENDED' },
  ]);
}
