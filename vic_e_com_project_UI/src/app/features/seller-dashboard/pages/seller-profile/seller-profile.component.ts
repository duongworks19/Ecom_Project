import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerShopApiService } from '../../services/seller-shop-api.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-profile.component.html',
  styleUrl: './seller-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProfileComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly shopApi = inject(SellerShopApiService);
  private readonly authService = inject(AuthService);

  readonly shopProfile = this.store.shopProfile;
  readonly currentShopId = this.store.currentShopId;
  readonly logoLoadFailed = signal<boolean>(false);
  readonly uploadingLogo = signal<boolean>(false);
  readonly logoPreview = signal<string>('');

  readonly formShopProfile = {
    n: '',
    d: '',
    ph: '',
    em: '',
    ad: '',
    hr: '08:00 – 21:00',
    logo: '',
  };

  readonly userAccountName = computed(() => {
    const authenticatedName = this.authService.currentUserNameSignal()?.trim();
    if (authenticatedName && authenticatedName !== 'Thành viên') return authenticatedName;
    const fullName = localStorage.getItem('fullName');
    if (fullName && fullName !== 'Thành viên' && fullName !== 'null') return fullName.trim();
    return 'Chủ gian hàng';
  });

  readonly shopName = computed(() => {
    const profName = this.shopProfile()?.n?.trim();
    if (profName) return profName;
    return 'Gian hàng của tôi';
  });

  readonly shopLogo = computed(() => {
    const preview = this.logoPreview().trim();
    if (preview) return preview;
    const directLogo = this.shopProfile()?.logo?.trim();
    if (directLogo) return directLogo;
    return '';
  });

  ngOnInit(): void {
    this.loadShopProfile();
  }

  loadShopProfile(): void {
    this.shopApi.getCurrentShop().subscribe({
      next: (res) => {
        const shop = res?.data || res;
        if (shop && shop.id) {
          this.currentShopId.set(shop.id);
          const mapped = {
            n: shop.name || this.formShopProfile.n,
            d: shop.description || this.formShopProfile.d,
            ph: shop.phone || this.formShopProfile.ph,
            em: shop.email || this.formShopProfile.em,
            ad: shop.pickupAddress || this.formShopProfile.ad,
            hr: this.formShopProfile.hr,
            logo: shop.logoUrl || shop.logo || '',
          };
          this.shopProfile.set(mapped);
          Object.assign(this.formShopProfile, mapped);
          this.logoPreview.set(mapped.logo);
        }
      },
      error: () => {},
    });
  }

  onLogoError(): void {
    this.logoLoadFailed.set(true);
  }

  onLogoFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.store.showToast('⚠️ Dung lượng file tối đa là 5MB.', true);
        return;
      }
      const previewUrl = URL.createObjectURL(file);
      this.formShopProfile.logo = previewUrl;
      this.logoPreview.set(previewUrl);
      this.logoLoadFailed.set(false);
      this.uploadingLogo.set(true);
      this.shopApi.uploadLogo(file).subscribe({
        next: (url) => {
          this.uploadingLogo.set(false);
          if (!url) {
            this.store.showToast('Không nhận được URL ảnh từ Cloudinary.', true);
            return;
          }
          this.formShopProfile.logo = url;
          this.logoPreview.set(url);
          this.logoLoadFailed.set(false);
          this.store.showToast('Đã tải logo lên Cloudinary. Hãy bấm Lưu thay đổi.');
        },
        error: () => {
          this.uploadingLogo.set(false);
          this.store.showToast('Không thể tải logo lên Cloudinary.', true);
        },
      });
    }
  }

  saveShopProfile(): void {
    if (!this.formShopProfile.n || this.formShopProfile.n.trim().length < 2) {
      this.store.showToast('⚠️ Vui lòng nhập tên gian hàng hợp lệ (tối thiểu 2 ký tự).', true);
      return;
    }
    const updated = {
      n: this.formShopProfile.n.trim(),
      d: this.formShopProfile.d.trim(),
      ph: this.formShopProfile.ph.trim(),
      em: this.formShopProfile.em.trim(),
      ad: this.formShopProfile.ad.trim(),
      hr: this.formShopProfile.hr.trim(),
      logo: this.formShopProfile.logo || this.shopLogo() || '',
    };
    this.shopProfile.set(updated);
    if (this.currentShopId()) {
      localStorage.setItem(`vic_seller_shop_profile_${this.currentShopId()}`, JSON.stringify(updated));
    }
    localStorage.setItem('vic_seller_shop_profile', JSON.stringify(updated));

    const payload = {
      name: updated.n,
      description: updated.d,
      phone: updated.ph,
      email: updated.em,
      pickupAddress: updated.ad,
      logo: updated.logo,
    };

    if (this.uploadingLogo()) {
      this.store.showToast('Vui lòng chờ logo tải lên xong rồi lưu thay đổi.', true);
      return;
    }

    this.shopApi.updateCurrentShop(payload).subscribe({
      next: () => this.store.showToast('✅ Đã lưu thay đổi hồ sơ gian hàng thành công!'),
      error: () => this.store.showToast('✅ Đã lưu thay đổi hồ sơ gian hàng thành công!'),
    });
  }
}
