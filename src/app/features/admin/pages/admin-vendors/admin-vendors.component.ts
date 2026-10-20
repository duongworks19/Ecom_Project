import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AdminVendorListItem,
  AdminVendorSummary,
  AdminVendorsService,
} from '../../services/admin-vendors.service';

@Component({
  selector: 'vic-admin-vendors',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-vendors.component.html',
  styleUrl: './admin-vendors.component.scss',
})
export class AdminVendorsComponent implements OnInit {
  private vendorService = inject(AdminVendorsService);

  readonly summary = signal<AdminVendorSummary>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  readonly vendors = signal<AdminVendorListItem[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  // Filters
  keyword = '';
  selectedStatus = 'ALL';
  page = 0;
  size = 10;
  totalElements = 0;

  // Review Modal state
  readonly reviewModalVendor = signal<AdminVendorListItem | null>(null);
  reviewAction: 'APPROVE' | 'REJECT' = 'APPROVE';
  rejectReason = '';
  readonly isReviewing = signal<boolean>(false);

  // KYC Preview Modal
  readonly kycPreviewUrl = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.vendorService.getSummary().subscribe({
      next: (sum) => this.summary.set(sum),
      error: () => {},
    });

    this.vendorService
      .getVendors(this.keyword, this.selectedStatus, this.page, this.size)
      .subscribe({
        next: (res) => {
          this.vendors.set(res.items);
          this.totalElements = res.total;
          this.isLoading.set(false);
        },
        error: () => {
          this.isLoading.set(false);
          this.errorMessage.set('Không thể tải danh sách vendor. Vui lòng thử lại sau.');
        },
      });
  }

  onFilterStatus(status: string): void {
    this.selectedStatus = status;
    this.page = 0;
    this.loadData();
  }

  onSearch(): void {
    this.page = 0;
    this.loadData();
  }

  openApproveModal(vendor: AdminVendorListItem): void {
    this.reviewModalVendor.set(vendor);
    this.reviewAction = 'APPROVE';
    this.rejectReason = '';
  }

  openRejectModal(vendor: AdminVendorListItem): void {
    this.reviewModalVendor.set(vendor);
    this.reviewAction = 'REJECT';
    this.rejectReason = '';
  }

  closeReviewModal(): void {
    if (!this.isReviewing()) {
      this.reviewModalVendor.set(null);
    }
  }

  confirmReview(): void {
    const vendor = this.reviewModalVendor();
    if (!vendor) return;

    if (this.reviewAction === 'REJECT' && !this.rejectReason.trim()) {
      alert('Vui lòng nhập lý do từ chối hồ sơ.');
      return;
    }

    this.isReviewing.set(true);

    this.vendorService
      .reviewVendor(vendor.id, {
        action: this.reviewAction,
        rejectReason: this.reviewAction === 'REJECT' ? this.rejectReason.trim() : undefined,
      })
      .subscribe({
        next: () => {
          this.isReviewing.set(false);
          this.reviewModalVendor.set(null);
          this.showToast(
            this.reviewAction === 'APPROVE'
              ? `Đã phê duyệt thành công gian hàng "${vendor.shopName}"`
              : `Đã từ chối hồ sơ gian hàng "${vendor.shopName}"`
          );
          this.loadData();
        },
        error: (err) => {
          this.isReviewing.set(false);
          alert(err.error?.message || 'Có lỗi xảy ra khi xét duyệt hồ sơ.');
        },
      });
  }

  openKycPreview(url?: string): void {
    if (url) {
      this.kycPreviewUrl.set(url);
    }
  }

  closeKycPreview(): void {
    this.kycPreviewUrl.set(null);
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 4000);
  }
}
