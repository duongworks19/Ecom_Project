export interface StorePromotionConfig {
  /**
   * Trạng thái chiến dịch Sale/Giảm giá do Admin bật/tắt thủ công.
   * Khi FALSE (mặc định): Ẩn toàn bộ badge giảm giá, ẩn giá gạch ngang, chỉ hiển thị giá niêm yết chuẩn.
   * Khi TRUE: Chỉ hiển thị giảm giá cho các sản phẩm được chỉ định trong chiến dịch.
   */
  isSaleCampaignActive: boolean;
  campaignTitle?: string;
}
