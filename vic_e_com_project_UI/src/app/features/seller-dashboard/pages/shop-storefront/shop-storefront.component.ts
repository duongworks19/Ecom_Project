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
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SellerDashboardService } from '../../services/seller-dashboard.service';
import { SellerProduct } from '../../models/seller-dashboard.model';

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

@Component({
  selector: 'app-shop-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink],
  templateUrl: './shop-storefront.component.html',
  styleUrl: './shop-storefront.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopStorefrontComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly http = inject(HttpClient);
  readonly dashboardService = inject(SellerDashboardService);

  readonly currentShop = signal<ShopData | null>(null);
  readonly shopProducts = signal<SellerProduct[]>([]);
  readonly isLoading = signal<boolean>(true);

  readonly activeCategory = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isFollowing = signal<boolean>(false);
  readonly claimedVouchers = signal<Record<number, boolean>>({});
  readonly selectedProduct = signal<SellerProduct | null>(null);
  readonly toastMessage = signal<string | null>(null);

  readonly vouchers = this.dashboardService.vouchers;
  readonly reviews = this.dashboardService.reviews;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.loadShopById(Number(id));
      } else {
        this.loadCurrentShop();
      }
    });
  }

  loadShopById(id: number): void {
    this.isLoading.set(true);
    this.http.get<any>(`http://localhost:9090/api/shops/${id}`).subscribe({
      next: (res) => {
        const shop = res?.data || res;
        this.currentShop.set(shop);
        this.loadProductsForShop(id);
      },
      error: () => {
        this.loadCurrentShop();
      },
    });
  }

  loadCurrentShop(): void {
    this.isLoading.set(true);
    this.http.get<any>('http://localhost:9090/api/shops/current').subscribe({
      next: (res) => {
        const shop = res?.data || res;
        if (shop && shop.id) {
          this.currentShop.set(shop);
          this.loadProductsForShop(shop.id);
        } else {
          this.loadFallbackFromStorage();
        }
      },
      error: () => {
        this.http.get<any>('http://localhost:9090/api/shops').subscribe({
          next: (shopsRes) => {
            const list = shopsRes?.data || shopsRes;
            if (Array.isArray(list) && list.length > 0) {
              this.currentShop.set(list[0]);
              this.loadProductsForShop(list[0].id);
            } else {
              this.loadFallbackFromStorage();
            }
          },
          error: () => this.loadFallbackFromStorage(),
        });
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

  private loadFallbackFromStorage(): void {
    this.isLoading.set(false);
    this.dashboardService.loadShopProductsFromStorage();
    this.shopProducts.set(this.dashboardService.products());
  }

  readonly shopName = computed(() => {
    return this.currentShop()?.name || this.dashboardService.dashboard().shopName || 'VICMART Shop';
  });

  readonly shopAvatarLetter = computed(() => {
    return this.shopName().charAt(0).toUpperCase();
  });

  readonly shopCategory = computed(() => {
    return this.currentShop()?.description || this.dashboardService.shopProfile().tagline || 'Thời trang & Phụ kiện';
  });

  readonly shopPickupAddress = computed(() => {
    return this.currentShop()?.pickupAddress || this.dashboardService.shopProfile().pickupAddress || 'Toàn quốc';
  });

  readonly shopDescription = computed(() => {
    return this.currentShop()?.description || this.dashboardService.shopProfile().description || 'Gian hàng chính hãng trên sàn thương mại điện tử VIC MART.';
  });

  readonly shopPhone = computed(() => {
    return this.currentShop()?.phone || this.dashboardService.shopProfile().phone || '1900 6868';
  });

  readonly shopEmail = computed(() => {
    return this.currentShop()?.email || this.dashboardService.shopProfile().email || 'cskh@vicmart.vn';
  });

  readonly shopRating = computed(() => {
    const r = this.currentShop()?.ratingAvg;
    return r ? Number(r).toFixed(1) : '5.0';
  });

  readonly products = computed(() => {
    return this.shopProducts();
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
    this.isFollowing.update((v) => !v);
    this.showToast(
      this.isFollowing()
        ? `Đã theo dõi gian hàng ${this.shopName()}!`
        : `Đã bỏ theo dõi gian hàng ${this.shopName()}`
    );
  }

  claimVoucher(id: number, code: string): void {
    this.claimedVouchers.update((curr) => ({ ...curr, [id]: true }));
    this.showToast(`Đã lưu mã giảm giá ${code} vào ví voucher!`);
  }

  openProductDetail(product: SellerProduct): void {
    this.selectedProduct.set(product);
  }

  buyNow(product: SellerProduct, event?: Event): void {
    event?.stopPropagation();
    this.showToast(`Đã thêm "${product.name}" vào giỏ hàng của bạn!`);
    this.selectedProduct.set(null);
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
