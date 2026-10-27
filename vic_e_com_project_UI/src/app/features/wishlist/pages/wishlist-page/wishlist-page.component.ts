import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { WishlistApiService } from '../../services/wishlist-api.service';
import { WishlistStateService } from '../../services/wishlist-state.service';
import { WishlistItem } from '../../models/wishlist.models';
import { RouterLink } from '@angular/router';
import { WishlistCardComponent } from '../../components/wishlist-card/wishlist-card.component';
import { SkeletonComponent } from '../../../../shared/ui/skeleton/skeleton.component';
import { mapApiError } from '../../../../shared/utils/api-error-messages';
import { HttpErrorResponse } from '@angular/common/http';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-wishlist-page',
  standalone: true,
  imports: [RouterLink, WishlistCardComponent, SkeletonComponent],
  templateUrl: './wishlist-page.component.html',
  styleUrl: './wishlist-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WishlistPageComponent {
  private readonly api = inject(WishlistApiService);
  private readonly wishlistState = inject(WishlistStateService);

  readonly items = signal<WishlistItem[]>([]);
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly errorMsg = signal<string | null>(null);
  readonly currentPage = signal(0);
  readonly totalElements = signal(0);
  readonly hasMore = signal(false);

  readonly skeletonArr = Array.from({ length: 8 });

  constructor() {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    if (page === 0) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }
    this.errorMsg.set(null);

    this.api.getPage(page, PAGE_SIZE).subscribe({
      next: (res) => {
        const merged = page === 0 ? res.content : [...this.items(), ...res.content];
        this.items.set(merged);
        this.totalElements.set(res.totalElements);
        this.currentPage.set(page);
        this.hasMore.set(merged.length < res.totalElements);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.errorMsg.set(mapApiError(err));
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  loadMore(): void {
    if (!this.isLoadingMore()) {
      this.loadPage(this.currentPage() + 1);
    }
  }

  /** Khi bấm tim (xóa khỏi wishlist) → gỡ thẻ khỏi lưới. */
  onHeartToggled(productId: number): void {
    if (!this.wishlistState.ids().has(productId)) {
      this.items.update((list) => list.filter((i) => i.productId !== productId));
      this.totalElements.update((n) => n - 1);
    }
  }
}
