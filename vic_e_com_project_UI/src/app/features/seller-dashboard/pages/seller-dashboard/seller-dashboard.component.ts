import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerShopApiService } from '../../services/seller-shop-api.service';
import { SellerOrdersApiService } from '../../services/seller-orders-api.service';
import { SellerReturnsApiService } from '../../services/seller-returns-api.service';
import { SellerQaReviewsApiService } from '../../services/seller-qa-reviews-api.service';
import { SellerProductService } from '../../services/seller-product.service';
import { SellerToastComponent } from '../../components/seller-toast/seller-toast.component';

export type {
  SellerCategoryOption,
  OrderItem,
  ReturnItem,
  ReviewItem,
  QuestionItem,
  VoucherItem,
  CampaignItem,
} from '../../models/seller-dashboard.model';

function resolveUserAccountName(currentName: string | null | undefined): string {
  if (currentName && currentName !== 'Thành viên') return currentName.trim();
  try {
    const draftRaw = localStorage.getItem('seller_onboarding_draft') || localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      const d = JSON.parse(draftRaw);
      if (d.userInfo?.fullName) return d.userInfo.fullName;
      if (d.contactInfo?.representativeName?.trim()) return d.contactInfo.representativeName.trim();
    }
    const fullName = localStorage.getItem('fullName');
    if (fullName && fullName !== 'Thành viên' && fullName !== 'null' && fullName !== 'undefined') return fullName.trim();
    const profRaw = localStorage.getItem('user_profile');
    const pFullName = profRaw ? JSON.parse(profRaw)?.fullName?.trim() : '';
    if (pFullName && pFullName !== 'Thành viên' && pFullName !== 'null' && pFullName !== 'undefined') return pFullName;
    const currentUsername = localStorage.getItem('currentUsername');
    if (currentUsername) return currentUsername.trim();
  } catch { }
  return 'Người bán VICMART';
}

function resolveShopName(profName?: string): string {
  if (profName?.trim()) return profName.trim();
  try {
    const savedProfRaw = localStorage.getItem('seller_profile');
    if (savedProfRaw) {
      const p = JSON.parse(savedProfRaw);
      if (p?.n?.trim()) return p.n.trim();
      if (p?.shopName?.trim()) return p.shopName.trim();
    }
    const draftRaw = localStorage.getItem('seller_onboarding_draft') || localStorage.getItem('vic_seller_onboarding_draft');
    if (draftRaw) {
      const d = JSON.parse(draftRaw);
      if (d.shopInfo?.shopName?.trim()) return d.shopInfo.shopName.trim();
    }
  } catch { }
  return 'Gian hàng của tôi';
}

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    SellerToastComponent,
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerDashboardComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly shopApi = inject(SellerShopApiService);
  private readonly ordersApi = inject(SellerOrdersApiService);
  private readonly returnsApi = inject(SellerReturnsApiService);
  private readonly qaReviewsApi = inject(SellerQaReviewsApiService);
  private readonly productService = inject(SellerProductService);

  readonly currentShopId = this.store.currentShopId;
  readonly shopStatus = this.store.shopStatus;
  readonly toastMessage = this.store.toastMessage;
  readonly isToastError = this.store.isToastError;

  readonly totalTodoCount = this.store.totalTodoCount;
  readonly openOrdersCount = this.store.openOrdersCount;
  readonly pendingReturnCount = this.store.pendingReturnCount;
  readonly lowStockItems = this.store.lowStockItems;
  readonly unrepliedReviewCount = this.store.unrepliedReviewCount;
  readonly unrepliedQuestionCount = this.store.unrepliedQuestionCount;

  readonly userMenuOpen = signal<boolean>(false);
  readonly logoLoadFailed = signal<boolean>(false);
  readonly uploadedFiles = signal<Record<string, string>>({});
  readonly requiredDocs = [
    'Mặt sau CCCD',
    'Giấy phép kinh doanh (bản sao công chứng)',
  ];

  readonly userAccountName = computed(() =>
    resolveUserAccountName(this.authService.currentUserNameSignal())
  );

  readonly shopName = computed(() =>
    resolveShopName(this.store.shopProfile()?.n)
  );

  readonly userAvatarLetter = computed(() => {
    const name = this.userAccountName();
    return name ? name.charAt(0).toUpperCase() : 'S';
  });

  readonly shopLogo = computed(() => {
    const profLogo = this.store.shopProfile()?.logo;
    if (profLogo) return profLogo;
    try {
      const stored = localStorage.getItem('shop_logo_override');
      if (stored) return stored;
    } catch { }
    return '';
  });

  ngOnInit(): void {
    this.detectApprovedRole();
    this.loadStoreInitialData();
  }

  detectApprovedRole(): void {
    try {
      const role = this.authService.currentRoleSignal();
      if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
        this.store.shopStatus.set('APPROVED');
        return;
      }
      const draftRaw = localStorage.getItem('seller_onboarding_draft') || localStorage.getItem('vic_seller_onboarding_draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft.status === 'APPROVED' || role === 'VENDOR' || role === 'ROLE_VENDOR') {
          this.store.shopStatus.set('APPROVED');
          return;
        }
        if (draft.status) {
          this.store.shopStatus.set(draft.status);
          return;
        }
      }
      if (role === 'VENDOR' || role === 'ROLE_VENDOR') {
        this.store.shopStatus.set('APPROVED');
      }
    } catch { }
  }

  private loadStoreInitialData(): void {
    this.shopApi.getSellerProfile().subscribe({
      next: (profile: any) => {
        if (profile) this.store.shopProfile.set(profile);
      },
    });
    this.shopApi.getCurrentShop().subscribe({
      next: (shop: any) => {
        if (shop?.id) this.store.currentShopId.set(Number(shop.id));
      },
    });
    this.productService.getProducts().subscribe({
      next: (prods: any) => {
        if (prods) this.store.products.set(prods);
      },
    });
    this.ordersApi.getOrders().subscribe({
      next: (orders: any) => {
        if (orders) this.store.orders.set(orders);
      },
    });
    this.returnsApi.getReturns().subscribe({
      next: (returns: any) => {
        if (returns) this.store.returns.set(returns);
      },
    });
    this.qaReviewsApi.getReviews().subscribe({
      next: (reviews: any) => {
        const list = reviews?.data || reviews;
        if (Array.isArray(list)) this.store.reviews.set(list);
      },
    });
    this.qaReviewsApi.getQuestions().subscribe({
      next: (questions: any) => {
        const list = questions?.data || questions;
        if (Array.isArray(list)) this.store.questions.set(list);
      },
    });
  }

  toggleUserMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.userMenuOpen.update((v) => !v);
  }

  closeUserMenu(): void {
    this.userMenuOpen.set(false);
  }

  onLogout(): void {
    this.closeUserMenu();
    this.authService.isLoggedInSignal.set(false);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('fullName');
    this.router.navigate(['/auth/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.me-wrap')) this.closeUserMenu();
  }

  onLogoError(): void {
    this.logoLoadFailed.set(true);
  }

  onFileSelect(event: Event, docName: string): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.store.showToast('Tệp quá lớn. Tối đa 5MB.', true);
        return;
      }
      this.uploadedFiles.update((f) => ({ ...f, [docName]: file.name }));
    }
  }

  submitAdditionalDocs(): void {
    this.store.shopStatus.set('RESUBMITTED');
    this.store.showToast('Đã gửi bổ sung tài liệu. Admin sẽ duyệt trong 1–2 ngày làm việc.');
  }

  showToast(msg: string, isError: boolean = false): void {
    this.store.showToast(msg, isError);
  }
}
