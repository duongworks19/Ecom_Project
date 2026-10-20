import { Injectable, signal } from '@angular/core';
import { StorePromotionConfig } from '../models/store-config.model';

@Injectable({
  providedIn: 'root',
})
export class StoreConfigService {
  /**
   * Cờ bật/tắt chiến dịch giảm giá do Admin chủ động điều khiển.
   * Mặc định là FALSE (TẮT hoàn toàn, không tự động hiện sale).
   */
  readonly promotionConfig = signal<StorePromotionConfig>({
    isSaleCampaignActive: false,
    campaignTitle: 'Chương Trình Khuyến Mãi Mùa Hè',
  });

  /**
   * Phương thức để Admin bật hoặc tắt hiển thị giảm giá
   */
  setSaleCampaignActive(isActive: boolean) {
    this.promotionConfig.update((cfg) => ({
      ...cfg,
      isSaleCampaignActive: isActive,
    }));
  }

  toggleSaleCampaign() {
    this.promotionConfig.update((cfg) => ({
      ...cfg,
      isSaleCampaignActive: !cfg.isSaleCampaignActive,
    }));
  }
}
