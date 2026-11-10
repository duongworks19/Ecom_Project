import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/services/auth.service';
import {
  SellerDashboardStore,
  SellerPageNotificationItem,
} from '../../services/seller-dashboard.store';
import { SellerShopApiService } from '../../services/seller-shop-api.service';
import { SellerOrdersApiService } from '../../services/seller-orders-api.service';
import { SellerReturnsApiService } from '../../services/seller-returns-api.service';
import { SellerQaReviewsApiService } from '../../services/seller-qa-reviews-api.service';
import { SellerVouchersApiService } from '../../services/seller-vouchers-api.service';
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
  private readonly destroyRef = inject(DestroyRef);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly shopApi = inject(SellerShopApiService);
  private readonly ordersApi = inject(SellerOrdersApiService);
  private readonly returnsApi = inject(SellerReturnsApiService);
  private readonly qaReviewsApi = inject(SellerQaReviewsApiService);
  private readonly vouchersApi = inject(SellerVouchersApiService);
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

  // Page-specific Notifications from Store
  readonly currentPageLabel = this.store.currentPageLabel;
  readonly currentPageNotifications = this.store.currentPageNotifications;
  readonly currentPageUnreadCount = this.store.currentPageUnreadCount;

  readonly notifMenuOpen = signal<boolean>(false);
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
    const role = this.authService.getRole()?.toUpperCase();
    if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
      void this.router.navigateByUrl('/admin');
      return;
    }
    this.store.setActivePageFromUrl(this.router.url);
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((e) => {
        this.store.setActivePageFromUrl(e.urlAfterRedirects || e.url);
        this.notifMenuOpen.set(false);
      });

    this.detectApprovedRole();
    this.loadStoreInitialData();
  }

  detectApprovedRole(): void {
    try {
      const role = this.authService.currentRoleSignal();
      if (role === 'ADMIN' || role === 'ROLE_ADMIN') {
        void this.router.navigateByUrl('/admin');
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
        if (profile) this.store.setShopProfile(profile);
      },
    });
    this.shopApi.getCurrentShop().subscribe({
      next: (shopRes: any) => {
        const shop = shopRes?.data || shopRes;
        if (shop?.id) {
          this.store.currentShopId.set(Number(shop.id));
          this.store.setShopProfile(shop);
        }
      },
    });
    this.productService.getProducts().subscribe({
      next: (prods: any) => {
        if (Array.isArray(prods)) this.store.products.set(prods);
      },
    });
    this.ordersApi.getOrders().subscribe({
      next: (orders: any) => {
        const list = orders?.data || orders || [];
        if (Array.isArray(list)) this.store.setOrders(list);
      },
    });
    this.returnsApi.getReturns().subscribe({
      next: (returns: any) => {
        const list = returns?.data || returns || [];
        if (Array.isArray(list)) this.store.setReturns(list);
      },
    });
    this.qaReviewsApi.getReviews().subscribe({
      next: (reviews: any) => {
        const list = reviews?.data || reviews || [];
        if (Array.isArray(list)) this.store.setReviews(list);
      },
    });
    this.qaReviewsApi.getQuestions().subscribe({
      next: (questions: any) => {
        const list = questions?.data || questions || [];
        if (Array.isArray(list)) this.store.setQuestions(list);
      },
    });
    this.vouchersApi.getVouchers().subscribe({
      next: (vouchers: any) => {
        const list = vouchers?.data || vouchers || [];
        if (Array.isArray(list)) this.store.setVouchers(list);
      },
    });
    this.http.get<any>(`${environment.apiUrl}/seller/campaigns`).subscribe({
      next: (campaigns: any) => {
        const list = campaigns?.data || campaigns || [];
        if (Array.isArray(list)) this.store.setCampaigns(list);
      },
      error: () => {},
    });
  }

  toggleNotifMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.userMenuOpen.set(false);
    this.notifMenuOpen.update((v) => !v);
  }

  closeNotifMenu(): void {
    this.notifMenuOpen.set(false);
  }

  onSelectNotification(item: SellerPageNotificationItem): void {
    this.store.markNotificationRead(item.id);
    this.closeNotifMenu();
    if (item.route) {
      void this.router.navigateByUrl(item.route);
    }
  }

  onMarkAllPageNotificationsRead(event: MouseEvent): void {
    event.stopPropagation();
    this.store.markCurrentPageNotificationsRead();
  }

  toggleUserMenu(event?: MouseEvent): void {
    if (event) event.stopPropagation();
    this.notifMenuOpen.set(false);
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
    if (!target.closest('.notif-wrap')) this.closeNotifMenu();
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
