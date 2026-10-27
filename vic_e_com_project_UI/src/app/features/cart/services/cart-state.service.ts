import { Injectable, inject, signal } from '@angular/core';
import { CartApiService } from './cart-api.service';

/**
 * Trạng thái toàn cục của giỏ hàng.
 * Chỉ lưu `count` badge — dữ liệu chi tiết thuộc về CartPageComponent.
 */
@Injectable({ providedIn: 'root' })
export class CartStateService {
  private readonly api = inject(CartApiService);

  /** Số dòng khả dụng trong giỏ (dùng cho badge header). */
  readonly count = signal<number>(0);

  /** Tải lại số lượng từ GET /cart/count và cập nhật signal. */
  refreshCount(): void {
    this.api.getCount().subscribe({
      next: (res) => this.count.set(res.count),
      error: () => {
        /* Lỗi count không chặn trải nghiệm; giữ nguyên giá trị cũ. */
      },
    });
  }

  /** Xóa sạch khi đăng xuất. */
  clear(): void {
    this.count.set(0);
  }
}
