import { Injectable, computed, inject, signal } from '@angular/core';
import { WishlistApiService } from './wishlist-api.service';
import { ToastService } from '../../../shared/ui/toast/toast.service';

/**
 * Trạng thái toàn cục của danh sách yêu thích.
 * Lưu tập productId — các component đọc để tô nút tim.
 * Toggle dùng cập nhật lạc quan: cập nhật UI ngay, hoàn tác khi lỗi.
 * // ponytail: không persist trạng thái pending khi reload trang.
 */
@Injectable({ providedIn: 'root' })
export class WishlistStateService {
  private readonly api = inject(WishlistApiService);
  private readonly toast = inject(ToastService);

  /** Tập productId đang được yêu thích. */
  readonly ids = signal<Set<number>>(new Set());

  /** Số sản phẩm yêu thích — dùng cho badge header. */
  readonly count = computed(() => this.ids().size);

  /** Tải lại toàn bộ ids từ GET /wishlist/ids. */
  refreshIds(): void {
    this.api.getIds().subscribe({
      next: (res) => this.ids.set(new Set(res.productIds)),
      error: () => {
        /* Lỗi ids không chặn trải nghiệm; giữ nguyên Set cũ. */
      },
    });
  }

  /** Toggle yêu thích với cập nhật lạc quan. */
  toggle(productId: number): void {
    const prev = new Set(this.ids());
    const isLiked = prev.has(productId);

    // Cập nhật lạc quan ngay lập tức.
    const next = new Set(prev);
    isLiked ? next.delete(productId) : next.add(productId);
    this.ids.set(next);

    const request$ = isLiked
      ? this.api.remove(productId)
      : this.api.add(productId);

    request$.subscribe({
      error: () => {
        // Hoàn tác khi lỗi.
        this.ids.set(prev);
        this.toast.error('Không thể cập nhật yêu thích, thử lại sau');
      },
    });
  }

  /** Xóa sạch khi đăng xuất. */
  clear(): void {
    this.ids.set(new Set());
  }
}
