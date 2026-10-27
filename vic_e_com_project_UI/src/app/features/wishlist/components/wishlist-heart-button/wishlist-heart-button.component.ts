import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  computed,
} from '@angular/core';
import { WishlistStateService } from '../../services/wishlist-state.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

/**
 * Nút tim dùng chung — đặt ở góc trên phải ảnh sản phẩm.
 * Nhận productId, tự đọc trạng thái từ WishlistStateService.
 */
@Component({
  selector: 'app-wishlist-heart-button',
  standalone: true,
  templateUrl: './wishlist-heart-button.component.html',
  styleUrl: './wishlist-heart-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistHeartButtonComponent {
  private readonly wishlistState = inject(WishlistStateService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly productId = input.required<number>();
  readonly toggled = output<void>();

  readonly isLiked = computed(() =>
    this.wishlistState.ids().has(this.productId())
  );

  readonly ariaLabel = computed(() =>
    this.isLiked() ? 'Bỏ khỏi yêu thích' : 'Thêm vào yêu thích'
  );

  onToggle(event: Event): void {
    event.stopPropagation();
    event.preventDefault();

    if (!this.authService.isLoggedIn()) {
      void this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.wishlistState.toggle(this.productId());
    this.toggled.emit();
  }
}
