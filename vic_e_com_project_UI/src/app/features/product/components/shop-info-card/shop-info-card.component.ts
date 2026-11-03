import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';

export interface ShopInfoData {
  id: number;
  name: string;
  logo?: string;
  description?: string;
  pickupAddress?: string;
  status?: string;
  ratingAvg?: number;
  followerCount?: number;
}

@Component({
  selector: 'app-shop-info-card',
  standalone: true,
  imports: [CommonModule, DecimalPipe, RouterLink],
  templateUrl: './shop-info-card.component.html',
  styleUrl: './shop-info-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopInfoCardComponent implements OnChanges {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  @Input({ required: true }) shopId!: number;
  @Input() shopName = '';

  readonly shop = signal<ShopInfoData | null>(null);
  readonly productCount = signal<number>(0);
  readonly reviewCount = signal<number>(0);
  readonly isFollowing = signal<boolean>(false);
  readonly isFollowLoading = signal<boolean>(false);
  readonly logoLoadFailed = signal<boolean>(false);

  readonly avatarLetter = computed(() => {
    const name = this.shop()?.name || this.shopName || 'S';
    return name.trim().charAt(0).toUpperCase();
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shopId'] && this.shopId) {
      this.loadShopAll(this.shopId);
    }
  }

  private loadShopAll(id: number): void {
    this.logoLoadFailed.set(false);

    // 1. Fetch shop profile from live API
    this.http.get<any>(`${environment.apiUrl}/shops/${id}`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data && (data.id || data.name)) {
          this.shop.set({
            id: data.id || id,
            name: data.name || this.shopName,
            logo: data.logo,
            description: data.description,
            pickupAddress: data.pickupAddress,
            status: data.status || 'ACTIVE',
            ratingAvg: Number(data.ratingAvg) || 5.0,
            followerCount: Number(data.followerCount) || 0,
          });
          this.cdr.markForCheck();
        }
      },
      error: () => {
        // ponytail: fallback if backend is unreachable
        this.shop.set({
          id,
          name: this.shopName || 'Gian hàng',
          ratingAvg: 5.0,
          followerCount: 0,
        });
        this.cdr.markForCheck();
      },
    });

    // 2. Product count
    this.http.get<any>(`${environment.apiUrl}/shops/${id}/products`).subscribe({
      next: (res) => {
        const list = res?.data || res;
        if (Array.isArray(list)) {
          this.productCount.set(list.length);
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });

    // 3. Review count
    this.http.get<any>(`${environment.apiUrl}/shops/${id}/reviews`).subscribe({
      next: (res) => {
        const list = res?.data || res;
        if (Array.isArray(list)) {
          this.reviewCount.set(list.length);
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });

    // 4. Follow status
    this.http.get<any>(`${environment.apiUrl}/shops/${id}/follow-status`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data) {
          this.isFollowing.set(Boolean(data.isFollowing));
          if (data.followerCount !== undefined) {
            this.shop.update((s) => s ? { ...s, followerCount: Number(data.followerCount) } : null);
          }
          this.cdr.markForCheck();
        }
      },
      error: () => {},
    });
  }

  toggleFollow(): void {
    if (this.isFollowLoading()) return;
    const current = this.isFollowing();

    if (!this.authService.isLoggedInSignal()) {
      // ponytail: local toggle fallback for guest visitors
      this.isFollowing.set(!current);
      this.shop.update((s) =>
        s ? { ...s, followerCount: Math.max(0, (s.followerCount || 0) + (current ? -1 : 1)) } : null
      );
      this.cdr.markForCheck();
      return;
    }

    this.isFollowLoading.set(true);
    this.http.post<any>(`${environment.apiUrl}/shops/${this.shopId}/follow`, { isFollowing: current }).subscribe({
      next: (res) => {
        this.isFollowLoading.set(false);
        const data = res?.data || res;
        if (data) {
          this.isFollowing.set(Boolean(data.isFollowing));
          if (data.followerCount !== undefined) {
            this.shop.update((s) => s ? { ...s, followerCount: Number(data.followerCount) } : null);
          }
        } else {
          this.isFollowing.set(!current);
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.isFollowLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }
}

