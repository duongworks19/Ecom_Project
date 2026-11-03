import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SellerDashboardService } from '../../services/seller-dashboard.service';
import { SellerProduct, SellerVoucher } from '../../models/seller-dashboard.model';
import { AuthService } from '../../../../core/services/auth.service';

export interface ShopData {
  id: number;
  vendorId?: number;
  name: string;
  logo?: string;
  banner?: string;
  description?: string;
  pickupAddress?: string;
  phone?: string;
  email?: string;
  status?: string;
  ratingAvg?: number;
}

export interface ShopReviewItem {
  id: number;
  customerName: string;
  productName?: string;
  productImage?: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

import { AddToCartPanelComponent } from '../../../product/components/add-to-cart-panel/add-to-cart-panel.component';
import { WishlistHeartButtonComponent } from '../../../wishlist/components/wishlist-heart-button/wishlist-heart-button.component';

@Component({
  selector: 'app-shop-storefront',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    RouterLink,
    AddToCartPanelComponent,
    WishlistHeartButtonComponent,
  ],
  templateUrl: './shop-storefront.component.html',
  styleUrl: './shop-storefront.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopStorefrontComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  readonly dashboardService = inject(SellerDashboardService);
  readonly authService = inject(AuthService);

  readonly currentShop = signal<ShopData | null>(null);
  readonly shopProducts = signal<SellerProduct[]>([]);
  readonly isLoading = signal<boolean>(true);

  readonly activeCategory = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isFollowing = signal<boolean>(false);
  readonly followerCount = signal<number>(0);
  readonly isFollowingLoading = signal<boolean>(false);
  readonly claimedVouchers = signal<Record<number, boolean>>({});
  readonly selectedProduct = signal<SellerProduct | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly shopVouchers = signal<SellerVoucher[]>([]);
  readonly vouchers = computed(() => {
    // Chỉ hiển thị các voucher đang ACTIVE, RUNNING và chưa hết hạn. Khi tạm dừng, voucher biến mất khỏi giao diện khách.
    return this.shopVouchers().filter(
      (v) => v.active && v.status === 'ACTIVE' && v.displayStatus !== 'PAUSED' && v.displayStatus !== 'EXPIRED'
    );
  });
  readonly reviews = signal<ShopReviewItem[]>([]);

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadShopById(Number(id));
      } else {
        this.loadCurrentShop();
      }
    });

    this.route.queryParamMap.subscribe(() => {
      this.checkAndOpenProductQueryParam();
    });
  }

  private initShopData(shop: any): void {
    this.currentShop.set(shop);
    if (shop && shop.id) {
      this.loadProductsForShop(shop.id);
      this.loadVouchersForShop(shop.id);
      this.loadFollowStatus(shop.id);
      this.loadShopReviews(shop.id);
    }
  }

  loadShopById(id: number): void {
    this.isLoading.set(true);
    this.http.get<any>(`http://localhost:9090/api/shops/${id}`).subscribe({
      next: (res) => {
        const shop = res?.data || res;
        this.initShopData(shop);
      },
      error: () => {
        this.loadCurrentShop();
      },
    });
  }

  loadCurrentShop(): void {
    this.isLoading.set(true);
    if (!this.authService.isLoggedInSignal()) {
      this.loadFirstActiveShop();
      return;
    }
    this.http.get<any>('http://localhost:9090/api/shops/current').subscribe({
      next: (res) => {
        const shop = res?.data || res;
        if (shop && shop.id) {
          this.initShopData(shop);
        } else {
          this.loadFirstActiveShop();
        }
      },
      error: () => {
        this.loadFirstActiveShop();
      },
    });
  }

  private loadFirstActiveShop(): void {
    this.http.get<any>('http://localhost:9090/api/shops').subscribe({
      next: (shopsRes) => {
        const list = shopsRes?.data || shopsRes;
        if (Array.isArray(list) && list.length > 0) {
          this.initShopData(list[0]);
        } else {
          this.loadFallbackFromStorage();
        }
      },
      error: () => this.loadFallbackFromStorage(),
    });
  }

  private isShopFollowedLocally(shopId: number): boolean {
    try {
      const list = JSON.parse(localStorage.getItem('vic_user_followed_shops') || '[]');
      return Array.isArray(list) && list.includes(shopId);
    } catch {
      return false;
    }
  }

  private setShopFollowedLocally(shopId: number, followed: boolean): void {
    try {
      let list: number[] = JSON.parse(localStorage.getItem('vic_user_followed_shops') || '[]');
      if (!Array.isArray(list)) list = [];
      if (followed) {
        if (!list.includes(shopId)) list.push(shopId);
      } else {
        list = list.filter((id) => id !== shopId);
      }
      localStorage.setItem('vic_user_followed_shops', JSON.stringify(list));
    } catch {}
  }

  loadFollowStatus(shopId: number): void {
    this.isFollowing.set(this.isShopFollowedLocally(shopId));
    this.http.get<any>(`http://localhost:9090/api/shops/${shopId}/follow-status`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data) {
          this.isFollowing.set(this.isShopFollowedLocally(shopId));
          this.followerCount.set(Number(data.followerCount) || 0);
        }
      },
      error: () => {},
    });
  }

  loadShopReviews(shopId: number): void {
    this.http.get<any>(`http://localhost:9090/api/shops/${shopId}/reviews`).subscribe({
      next: (res) => {
        const list = res?.data || res;
        if (Array.isArray(list)) {
          this.reviews.set(list);
        } else {
          this.reviews.set([]);
        }
      },
      error: () => {
        this.reviews.set([]);
      },
    });
  }

  loadProductsForShop(shopId: number): void {
    this.http.get<any>(`http://localhost:9090/api/shops/${shopId}/products`).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const prods = res?.data || res;
        if (Array.isArray(prods)) {
          this.shopProducts.set(prods);
          this.checkAndOpenProductQueryParam();
        } else {
          this.shopProducts.set([]);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.shopProducts.set([]);
      },
    });
  }

  private checkAndOpenProductQueryParam(): void {
    const prodParam = this.route.snapshot.queryParamMap.get('product') || this.route.snapshot.queryParamMap.get('productId');
    if (!prodParam) return;

    const pId = Number(prodParam);
    const found = this.shopProducts().find((p) => p.id === pId || (p.name && p.name.toLowerCase().includes(prodParam.toLowerCase())));
    if (found) {
      this.selectedProduct.set(found);
      return;
    }

    if (!isNaN(pId)) {
      this.http.get<any>('http://localhost:9090/api/products').subscribe({
        next: (res) => {
          const list = res?.data || res;
          if (Array.isArray(list)) {
            const item = list.find((p: any) => p.id === pId);
            if (item) {
              const sp: SellerProduct = {
                id: item.id,
                name: item.name,
                variant: 'Mặc định',
                sku: 'SP-' + item.id,
                category: item.category || 'Thời trang',
                price: Number(item.price) || 0,
                stock: 99,
                soldCount: item.soldCount || 0,
                thumbnailColor: '#3b82f6',
                imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
                status: 'ACTIVE',
              };
              this.selectedProduct.set(sp);
            }
          }
        },
        error: () => {},
      });
    }
  }

  loadVouchersForShop(shopId: number): void {
    this.http.get<any>(`http://localhost:9090/api/shops/${shopId}/vouchers`).subscribe({
      next: (res) => {
        const list = res?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          const mapped: SellerVoucher[] = list.map((item: any) => ({
            id: item.id,
            code: item.code,
            title: 'Voucher gian hàng',
            discountText: item.discountType === 'PERCENT'
              ? `Giảm ${item.value}%`
              : `Giảm ${Number(item.value).toLocaleString('vi-VN')}₫`,
            discountType: (item.discountType === 'FIXED' ? 'FIXED' : 'PERCENT') as 'PERCENT' | 'FIXED',
            value: Number(item.value) || 0,
            maxDiscount: item.maxDiscount != null ? Number(item.maxDiscount) : undefined,
            minOrderAmount: Number(item.minOrderAmount) || 0,
            usedCount: item.usedCount || 0,
            totalQuota: item.usageLimit || 100,
            usageLimit: item.usageLimit || 100,
            expiryDate: item.endAt ? item.endAt.split('T')[0] : '',
            startAt: item.startAt,
            endAt: item.endAt,
            status: item.status,
            displayStatus: item.displayStatus,
            active: item.status === 'ACTIVE' && item.displayStatus === 'RUNNING',
          }));
          this.shopVouchers.set(mapped);
        } else {
          this.shopVouchers.set([]);
        }
      },
      error: () => {
        this.shopVouchers.set([]);
      },
    });
  }

  private loadFallbackFromStorage(): void {
    this.isLoading.set(false);
    this.dashboardService.loadShopProductsFromStorage();
    this.shopProducts.set(this.dashboardService.products());
    this.checkAndOpenProductQueryParam();
    this.shopVouchers.set([]);
    this.reviews.set([]);
  }

  readonly logoLoadFailed = signal<boolean>(false);

  onLogoError(): void {
    this.logoLoadFailed.set(true);
  }

  readonly shopName = computed(() => {
    return this.currentShop()?.name || this.dashboardService.dashboard().shopName || 'VICMART Shop';
  });

  readonly shopLogo = computed(() => {
    const directLogo = this.currentShop()?.logo?.trim();
    if (directLogo) return directLogo;

    const dashLogo = this.dashboardService.dashboard()?.shopLogo?.trim();
    if (dashLogo) return dashLogo;

    const profLogo = (this.dashboardService.shopProfile() as any)?.logo?.trim();
    if (profLogo) return profLogo;

    const shopName = this.shopName().trim().toLowerCase();
    const shopId = this.currentShop()?.id;

    try {
      const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
      let stored = (shopId ? kycStorage[String(shopId)] : undefined) ||
                   (shopName ? kycStorage[shopName] : undefined);
      if (!stored && shopName) {
        for (const k of Object.keys(kycStorage)) {
          if (k.toLowerCase().includes(shopName) || shopName.includes(k.toLowerCase())) {
            stored = kycStorage[k];
            break;
          }
        }
      }
      if (!stored && kycStorage['latest_user_submission']) {
        stored = kycStorage['latest_user_submission'];
      }
      if (!stored) {
        for (const k of Object.keys(kycStorage)) {
          if (kycStorage[k]?.logo?.trim()) {
            stored = kycStorage[k];
            break;
          }
        }
      }
      if (stored?.logo?.trim()) return stored.logo.trim();
    } catch {}

    try {
      const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.shopInfo?.logoUrl?.trim()) return draft.shopInfo.logoUrl.trim();
      }
    } catch {}

    try {
      const profRaw = (shopId ? localStorage.getItem(`vic_seller_shop_profile_${shopId}`) : null) ||
                      localStorage.getItem('vic_seller_shop_profile');
      if (profRaw) {
        const prof = JSON.parse(profRaw);
        if (prof.logo?.trim()) return prof.logo.trim();
      }
    } catch {}

    return '';
  });

  readonly shopAvatarLetter = computed(() => {
    return this.shopName().charAt(0).toUpperCase();
  });

  readonly shopCategory = computed(() => {
    const cats = this.categories().filter((c) => c !== 'ALL');
    return cats.join(', ');
  });

  readonly shopPickupAddress = computed(() => {
    return this.currentShop()?.pickupAddress?.trim() || 'Đang cập nhật';
  });

  readonly shopDescription = computed(() => {
    const desc = this.currentShop()?.description?.trim();
    if (desc && !desc.toLowerCase().includes('bắc âu') && !desc.toLowerCase().includes('lumi')) {
      return desc;
    }
    return 'Gian hàng chưa cập nhật phần giới thiệu.';
  });

  readonly shopPhone = computed(() => {
    return this.currentShop()?.phone?.trim() || 'Đang cập nhật';
  });

  readonly shopEmail = computed(() => {
    return this.currentShop()?.email?.trim() || 'Đang cập nhật';
  });

  readonly shopBusinessHours = computed(() => {
    return (this.currentShop() as any)?.businessHours?.trim() || 'Đang cập nhật';
  });

  readonly shopRating = computed(() => {
    const revs = this.reviews();
    if (revs.length > 0) {
      const avg = revs.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / revs.length;
      return avg.toFixed(1);
    }
    const r = this.currentShop()?.ratingAvg;
    return r ? Number(r).toFixed(1) : null;
  });

  readonly products = computed(() => {
    // Chỉ hiển thị các sản phẩm đang công khai (VISIBLE / ACTIVE), ẩn hoàn toàn các sản phẩm có trạng thái HIDDEN hoặc DELETED
    return this.shopProducts().filter(
      (p: any) => p.status !== 'HIDDEN' && p.s !== 'HIDDEN' && p.status !== 'DELETED' && p.s !== 'DELETED'
    );
  });

  readonly categories = computed(() => {
    const set = new Set<string>();
    this.products().forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['ALL', ...Array.from(set)];
  });

  readonly filteredProducts = computed(() => {
    const cat = this.activeCategory();
    const q = this.searchQuery().trim().toLowerCase();
    return this.products().filter((p) => {
      const matchCat = cat === 'ALL' || p.category === cat;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  });

  toggleFollow(): void {
    const shop = this.currentShop();
    if (!shop || !shop.id) return;

    if (!this.authService.isLoggedInSignal()) {
      this.showToast('Vui lòng đăng nhập để theo dõi gian hàng!');
      this.router.navigate(['/login']);
      return;
    }

    if (this.isFollowingLoading()) return;
    this.isFollowingLoading.set(true);

    const currentlyFollowing = this.isFollowing();
    this.http.post<any>(`http://localhost:9090/api/shops/${shop.id}/follow`, { isFollowing: currentlyFollowing }).subscribe({
      next: (res) => {
        this.isFollowingLoading.set(false);
        const data = res?.data || res;
        const newFollowingState = !currentlyFollowing;
        this.setShopFollowedLocally(shop.id, newFollowingState);
        this.isFollowing.set(newFollowingState);
        if (data && data.followerCount != null) {
          this.followerCount.set(Number(data.followerCount));
        } else {
          this.followerCount.update((c) => newFollowingState ? c + 1 : Math.max(0, c - 1));
        }
        this.showToast(
          newFollowingState
            ? `Đã theo dõi gian hàng ${this.shopName()}!`
            : `Đã bỏ theo dõi gian hàng ${this.shopName()}`
        );
      },
      error: (err) => {
        this.isFollowingLoading.set(false);
        if (err.status === 401) {
          this.showToast('Vui lòng đăng nhập để theo dõi gian hàng!');
          this.router.navigate(['/login']);
        } else {
          this.showToast('Không thể cập nhật theo dõi gian hàng. Vui lòng thử lại.');
        }
      },
    });
  }

  claimVoucher(id: number, code: string): void {
    this.claimedVouchers.update((curr) => ({ ...curr, [id]: true }));
    this.showToast(`Đã lưu mã giảm giá ${code} vào ví voucher!`);
  }

  openProductDetail(product: SellerProduct): void {
    this.router.navigate(['/product', product.id]);
  }

  buyNow(product: SellerProduct, event?: Event): void {
    event?.stopPropagation();
    this.selectedProduct.set(product);
  }

  /** Returns the first IMAGE url from media[], falling back to imageUrl. */
  getProductImageUrl(product: SellerProduct): string {
    const firstImage = product.media
      ?.filter((m) => m.type === 'IMAGE')
      ?.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))[0];
    return firstImage?.url || product.imageUrl;
  }

  showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3000);
  }
}
