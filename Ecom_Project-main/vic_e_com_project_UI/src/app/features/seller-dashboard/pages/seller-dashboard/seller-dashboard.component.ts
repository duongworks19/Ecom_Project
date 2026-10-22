import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SellerDashboardService } from '../../services/seller-dashboard.service';
import {
  SellerNavTab,
  SellerNotification,
  SellerProduct,
  SellerShopProfile,
  VendorState,
} from '../../models/seller-dashboard.model';
import { SellerHeaderComponent } from '../../components/seller-header/seller-header.component';
import { SellerSidebarComponent } from '../../components/seller-sidebar/seller-sidebar.component';
import { SellerStatusViewComponent } from '../../components/seller-status-view/seller-status-view.component';
import { SellerOverviewComponent } from '../../components/seller-overview/seller-overview.component';
import { SellerOrdersComponent } from '../../components/seller-orders/seller-orders.component';
import { SellerReturnsComponent } from '../../components/seller-returns/seller-returns.component';
import { SellerProductsComponent } from '../../components/seller-products/seller-products.component';
import { SellerProductFormComponent } from '../../components/seller-product-form/seller-product-form.component';
import { SellerInventoryComponent } from '../../components/seller-inventory/seller-inventory.component';
import { SellerVouchersComponent } from '../../components/seller-vouchers/seller-vouchers.component';
import { SellerCampaignsComponent } from '../../components/seller-campaigns/seller-campaigns.component';
import { SellerReviewsComponent } from '../../components/seller-reviews/seller-reviews.component';
import { SellerQaComponent } from '../../components/seller-qa/seller-qa.component';
import { SellerProfileComponent } from '../../components/seller-profile/seller-profile.component';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    SellerHeaderComponent,
    SellerSidebarComponent,
    SellerStatusViewComponent,
    SellerOverviewComponent,
    SellerOrdersComponent,
    SellerReturnsComponent,
    SellerProductsComponent,
    SellerProductFormComponent,
    SellerInventoryComponent,
    SellerVouchersComponent,
    SellerCampaignsComponent,
    SellerReviewsComponent,
    SellerQaComponent,
    SellerProfileComponent,
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerDashboardComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly dashboardService = inject(SellerDashboardService);

  readonly data = this.dashboardService.dashboard;
  readonly shopState = this.dashboardService.shopState;
  readonly activeNav = this.dashboardService.activeNav;
  readonly products = this.dashboardService.products;
  readonly vouchers = this.dashboardService.vouchers;
  readonly promotions = this.dashboardService.promotions;
  readonly reviews = this.dashboardService.reviews;
  readonly notifications = this.dashboardService.notifications;
  readonly returns = this.dashboardService.returns;
  readonly qaQuestions = this.dashboardService.qaQuestions;
  readonly shopProfile = this.dashboardService.shopProfile;
  readonly toast = this.dashboardService.notificationMessage;
  readonly unreadNotificationCount = this.dashboardService.unreadNotificationCount;

  readonly editingProduct = signal<SellerProduct | null>(null);

  readonly openOrdersCount = computed(
    () =>
      this.data().recentOrders.filter((o) =>
        ['PENDING_CONFIRMATION', 'PREPARING', 'PACKED'].includes(o.status)
      ).length
  );

  readonly pendingReturnsCount = computed(
    () => this.returns().filter((r) => r.status === 'PENDING').length
  );

  readonly lowStockCount = computed(
    () => this.products().filter((p) => p.stock <= 10).length
  );

  readonly unrepliedReviewsCount = computed(
    () => this.reviews().filter((r) => !r.reply).length
  );

  readonly unansweredQaCount = computed(
    () => this.qaQuestions().filter((q) => !q.answer).length
  );

  constructor() {
    this.route.data.subscribe((data) => {
      const tab = data['tab'] as SellerNavTab;
      if (tab) {
        this.dashboardService.setActiveNav(tab);
      }
    });

    this.route.paramMap.subscribe((params) => {
      const tab = params.get('tab') as SellerNavTab;
      if (tab) {
        this.dashboardService.setActiveNav(tab);
      }
    });
  }

  onSelectNav(tab: SellerNavTab): void {
    this.dashboardService.setActiveNav(tab);
    if (tab === 'overview') {
      this.router.navigate(['/seller/dashboard']);
    } else {
      this.router.navigate(['/seller', tab]);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openAddProduct(): void {
    this.editingProduct.set(null);
    this.dashboardService.setActiveNav('add-product');
    this.router.navigate(['/seller/add-product']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openEditProduct(prod: SellerProduct): void {
    this.editingProduct.set(prod);
    this.dashboardService.setActiveNav('add-product');
    this.router.navigate(['/seller/add-product']);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSaveProduct(payload: {
    id?: number;
    name: string;
    category: string;
    status: 'ACTIVE' | 'HIDDEN';
    description: string;
    imageUrl: string;
    variant: string;
    sku: string;
    price: number;
    stock: number;
    threshold: number;
  }): void {
    if (payload.id) {
      this.dashboardService.products.update((list) =>
        list.map((p) =>
          p.id === payload.id
            ? {
                ...p,
                name: payload.name,
                category: payload.category,
                status: payload.status,
                imageUrl: payload.imageUrl,
                variant: payload.variant,
                sku: payload.sku,
                price: payload.price,
                stock: payload.stock,
              }
            : p
        )
      );
      const shopName = this.data().shopName;
      if (typeof window !== 'undefined' && shopName) {
        localStorage.setItem(
          `vic_seller_custom_products_${shopName}`,
          JSON.stringify(this.products())
        );
      }
      this.dashboardService.showToast('Đã cập nhật sản phẩm thành công!');
    } else {
      this.dashboardService.addNewProduct({
        name: payload.name,
        category: payload.category,
        variant: payload.variant,
        sku: payload.sku,
        price: payload.price,
        stock: payload.stock,
        imageUrl: payload.imageUrl,
        thumbnailColor: '#f3c7c0',
      });
    }

    this.onSelectNav('products');
  }

  onDeleteProduct(id: number): void {
    this.dashboardService.deleteProduct(id);
  }

  onToggleProductVisibility(id: number): void {
    this.dashboardService.toggleProductVisibility(id);
  }

  onUpdateStock(payload: { productId: number; stock: number; threshold: number }): void {
    this.dashboardService.updateVariantStockDirect(
      payload.productId,
      payload.stock,
      payload.threshold
    );
  }

  onCreateVoucher(payload: {
    code: string;
    title: string;
    discountText: string;
    minOrderAmount: number;
    totalQuota: number;
    expiryDate: string;
  }): void {
    this.dashboardService.createVoucher(payload);
  }

  onToggleVoucher(id: number): void {
    this.dashboardService.toggleVoucherStatus(id);
  }

  onDeleteVoucher(code: string): void {
    this.dashboardService.deleteVoucher(code);
  }

  onOrderAction(payload: { orderCode: string; action: string; reason?: string }): void {
    this.dashboardService.handleQuickAction(payload.orderCode, payload.action);
  }

  openRestockModal(item: { productId: number; name: string }): void {
    this.onSelectNav('inventory');
  }

  onAcceptReturn(id: number): void {
    this.dashboardService.acceptReturn(id);
  }

  onRejectReturn(payload: { id: number; reason: string }): void {
    this.dashboardService.rejectReturn(payload.id, payload.reason);
  }

  onSubmitReviewReply(payload: { id: number; reply: string }): void {
    this.dashboardService.replyToReview(payload.id, payload.reply);
  }

  onSubmitQaAnswer(payload: { id: number; answer: string }): void {
    this.dashboardService.answerQa(payload.id, payload.answer);
  }

  onSaveProfile(profile: SellerShopProfile): void {
    this.dashboardService.updateShopProfile(profile);
  }

  onResubmitDocuments(files: Record<string, string>): void {
    this.dashboardService.setShopState('RESUBMITTED');
    this.dashboardService.showToast(
      'Đã gửi bổ sung hồ sơ. Admin sẽ kiểm tra lại các mục bạn vừa nộp.'
    );
  }

  onNotificationClick(notif: SellerNotification): void {
    this.dashboardService.markNotificationAsRead(notif);
    this.onSelectNav(notif.targetNav);
  }

  onMarkAllRead(): void {
    this.dashboardService.markAllNotificationsAsRead();
  }

  onReRegister(): void {
    this.router.navigate(['/seller/onboarding']);
  }
}
