import {
  Component,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerDashboardService } from '../../services/seller-dashboard.service';
import {
  LowStockProduct,
  OrderFilterType,
  SellerNavTab,
  SellerNotification,
  SellerProduct,
  SellerRecentOrder,
  SellerShopProfile,
} from '../../models/seller-dashboard.model';
import { PRESET_DECOR_IMAGES } from '../../constants/seller-dashboard.mock';
import { SellerHeaderComponent } from '../../components/seller-header/seller-header.component';
import { SellerSidebarComponent } from '../../components/seller-sidebar/seller-sidebar.component';
import { RevenueChartComponent } from '../../components/revenue-chart/revenue-chart.component';
import { LowStockPanelComponent } from '../../components/low-stock-panel/low-stock-panel.component';
import { RecentOrdersTableComponent } from '../../components/recent-orders-table/recent-orders-table.component';

@Component({
  selector: 'app-seller-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    SellerHeaderComponent,
    SellerSidebarComponent,
    RevenueChartComponent,
    LowStockPanelComponent,
    RecentOrdersTableComponent,
  ],
  templateUrl: './seller-dashboard.component.html',
  styleUrl: './seller-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerDashboardComponent {
  readonly dashboardService = inject(SellerDashboardService);

  readonly data = this.dashboardService.dashboard;
  readonly selectedRange = this.dashboardService.selectedRange;
  readonly activeNav = this.dashboardService.activeNav;
  readonly orderFilter = this.dashboardService.orderFilter;
  readonly toast = this.dashboardService.notificationMessage;
  readonly products = this.dashboardService.products;
  readonly vouchers = this.dashboardService.vouchers;
  readonly promotions = this.dashboardService.promotions;
  readonly reviews = this.dashboardService.reviews;
  readonly notifications = this.dashboardService.notifications;
  readonly unreadNotificationCount = this.dashboardService.unreadNotificationCount;
  readonly filteredOrders = this.dashboardService.filteredOrders;
  readonly refundOrders = this.dashboardService.refundOrders;
  readonly stepProductsDone = this.dashboardService.stepProductsDone;
  readonly stepVoucherDone = this.dashboardService.stepVoucherDone;

  readonly presetImages = PRESET_DECOR_IMAGES;

  // Interactive modals state
  readonly showAddProductModal = signal<boolean>(false);
  readonly showShopPreviewModal = signal<boolean>(false);
  readonly showCreateVoucherModal = signal<boolean>(false);
  readonly selectedOrderForModal = signal<SellerRecentOrder | null>(null);
  readonly selectedProductForRestock = signal<{
    id: number;
    name: string;
    sku: string;
    variant: string;
    currentStock: number;
    imageUrl: string;
  } | null>(null);

  // Interactive inputs
  readonly restockQuantity = signal<number>(20);
  readonly productSearchQuery = signal<string>('');

  newProductForm = {
    name: '',
    variant: 'Màu kem Bắc Âu',
    sku: 'LM-105',
    category: 'Đèn trang trí',
    price: 350000,
    stock: 25,
    imageUrl: PRESET_DECOR_IMAGES[0].url,
    thumbnailColor: PRESET_DECOR_IMAGES[0].color,
  };

  newVoucherForm = {
    code: 'LUMI50K',
    title: 'Ưu đãi đặc biệt khách hàng mới',
    discountText: 'Giảm 50.000₫',
    minOrderAmount: 350000,
    totalQuota: 100,
    expiryDate: '31/12/2026',
  };

  replyDrafts: Record<number, string> = {};

  profileForm: SellerShopProfile = {
    ...this.dashboardService.shopProfile(),
  };

  readonly chartData = computed(() => {
    const range = this.selectedRange();
    const currentData = this.data();
    if (!currentData) return [];
    return range === '7'
      ? currentData.revenueChart7Days
      : currentData.revenueChart30Days;
  });

  readonly searchedProducts = computed(() => {
    const q = this.productSearchQuery().trim().toLowerCase();
    const list = this.products();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  });

  onTabChange(range: '7' | '30'): void {
    this.dashboardService.setRange(range);
  }

  selectNav(navKey: SellerNavTab, filter?: OrderFilterType): void {
    this.dashboardService.setActiveNav(navKey, filter);
    if (navKey === 'profile') {
      this.profileForm = { ...this.dashboardService.shopProfile() };
    }
  }

  onTodoClick(navKey: SellerNavTab, filter?: OrderFilterType, event?: Event): void {
    event?.preventDefault();
    this.selectNav(navKey, filter);
  }

  onAddProduct(event?: Event): void {
    event?.preventDefault();
    this.newProductForm = {
      name: '',
      variant: 'Trắng kem Minimal',
      sku: `LM-${Math.floor(100 + Math.random() * 899)}`,
      category: 'Đèn trang trí',
      price: 320000,
      stock: 25,
      imageUrl: PRESET_DECOR_IMAGES[0].url,
      thumbnailColor: PRESET_DECOR_IMAGES[0].color,
    };
    this.showAddProductModal.set(true);
  }

  selectPresetImage(preset: { label: string; url: string; color: string }): void {
    this.newProductForm.imageUrl = preset.url;
    this.newProductForm.thumbnailColor = preset.color;
    if (!this.newProductForm.name.trim()) {
      this.newProductForm.name = preset.label;
    }
  }

  submitNewProduct(): void {
    if (!this.newProductForm.name.trim()) {
      this.dashboardService.showToast('Vui lòng nhập tên sản phẩm!');
      return;
    }
    this.dashboardService.addNewProduct(this.newProductForm);
    this.showAddProductModal.set(false);
  }

  onUpdateStock(): void {
    this.selectNav('inventory');
  }

  openRestockForLowStock(prod: LowStockProduct): void {
    this.selectedProductForRestock.set({
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      variant: prod.variant,
      currentStock: prod.remainingQuantity,
      imageUrl: prod.imageUrl || PRESET_DECOR_IMAGES[0].url,
    });
    this.restockQuantity.set(20);
  }

  openRestockForProduct(prod: SellerProduct): void {
    this.selectedProductForRestock.set({
      id: prod.id,
      name: prod.name,
      sku: prod.sku,
      variant: prod.variant,
      currentStock: prod.stock,
      imageUrl: prod.imageUrl,
    });
    this.restockQuantity.set(20);
  }

  confirmRestock(): void {
    const target = this.selectedProductForRestock();
    if (!target) return;
    this.dashboardService.restockProduct(
      target.id,
      Number(this.restockQuantity()) || 10
    );
    this.selectedProductForRestock.set(null);
  }

  onOrderAction(order: SellerRecentOrder): void {
    if (order.nextAction === 'VIEW_DETAIL') {
      this.selectedOrderForModal.set(order);
      return;
    }
    this.dashboardService.handleQuickAction(order.orderCode, order.nextAction);
  }

  openOrderDetail(order: SellerRecentOrder): void {
    this.selectedOrderForModal.set(order);
  }

  triggerModalOrderAction(order: SellerRecentOrder, action: string): void {
    this.dashboardService.handleQuickAction(order.orderCode, action);
    const updated = this.data().recentOrders.find(
      (o) => o.orderCode === order.orderCode
    );
    this.selectedOrderForModal.set(updated || null);
  }

  onViewShopAsGuest(): void {
    this.showShopPreviewModal.set(true);
  }

  openCreateVoucherModal(event?: Event): void {
    event?.preventDefault();
    this.showCreateVoucherModal.set(true);
  }

  submitCreateVoucher(): void {
    if (!this.newVoucherForm.code.trim() || !this.newVoucherForm.title.trim()) {
      this.dashboardService.showToast(
        'Vui lòng nhập mã và tên chương trình voucher!'
      );
      return;
    }
    this.dashboardService.createVoucher(this.newVoucherForm);
    this.showCreateVoucherModal.set(false);
  }

  submitReply(reviewId: number): void {
    const text = this.replyDrafts[reviewId] || '';
    if (!text.trim()) {
      this.dashboardService.showToast('Vui lòng nhập nội dung phản hồi!');
      return;
    }
    this.dashboardService.replyCustomerReview(reviewId, text);
    this.replyDrafts[reviewId] = '';
  }

  saveProfile(): void {
    this.dashboardService.saveShopProfile(this.profileForm);
  }

  onNotificationSelect(notif: SellerNotification): void {
    this.dashboardService.markNotificationAsRead(notif);
  }

  onMarkAllRead(): void {
    this.dashboardService.markAllNotificationsAsRead();
  }
}
