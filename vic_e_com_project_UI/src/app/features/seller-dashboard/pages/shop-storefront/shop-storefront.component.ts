import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SellerDashboardService } from '../../services/seller-dashboard.service';
import { SellerProduct } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-shop-storefront',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink],
  templateUrl: './shop-storefront.component.html',
  styleUrl: './shop-storefront.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShopStorefrontComponent {
  readonly dashboardService = inject(SellerDashboardService);

  readonly data = this.dashboardService.dashboard;
  readonly profile = this.dashboardService.shopProfile;
  readonly products = this.dashboardService.products;
  readonly vouchers = this.dashboardService.vouchers;
  readonly reviews = this.dashboardService.reviews;

  readonly activeCategory = signal<string>('ALL');
  readonly searchQuery = signal<string>('');
  readonly isFollowing = signal<boolean>(false);
  readonly claimedVouchers = signal<Record<number, boolean>>({});
  readonly selectedProduct = signal<SellerProduct | null>(null);
  readonly toastMessage = signal<string | null>(null);

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
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  });

  toggleFollow(): void {
    this.isFollowing.update((v) => !v);
    this.showToast(
      this.isFollowing()
        ? `Đã theo dõi gian hàng ${this.data().shopName}!`
        : `Đã bỏ theo dõi gian hàng ${this.data().shopName}`
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
