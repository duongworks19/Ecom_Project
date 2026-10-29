import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';
import { StatusTimelineComponent } from '../../components/status-timeline/status-timeline.component';
import { ApplicationStatus } from '../../models/seller-onboarding.model';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-seller-status',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusTimelineComponent],
  templateUrl: './seller-status.component.html',
  styleUrl: './seller-status.component.scss',
})
export class SellerStatusComponent implements OnInit, OnDestroy {
  private readonly onboardingService = inject(SellerOnboardingService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly applicationData = this.onboardingService.application;
  readonly status = this.onboardingService.currentStatus;

  readonly isRefreshing = signal<boolean>(false);
  readonly lastCheckedTime = signal<string>('');

  private pollSubscription?: Subscription;
  private storageEventListener?: (event: StorageEvent) => void;
  private prevStatus: ApplicationStatus | null = null;

  ngOnInit(): void {
    this.prevStatus = this.status();
    this.updateLastCheckedTime();

    // 1. Kiểm tra trạng thái máy chủ ngay khi vừa mở trang
    this.refreshStatus(false);

    // 2. Tự động kiểm tra trạng thái định kỳ mỗi 2.5 giây khi hồ sơ đang chờ xét duyệt
    this.pollSubscription = interval(2500).subscribe(() => {
      const current = this.status();
      if (current === 'PENDING' || current === 'REVISION_NEEDED') {
        this.refreshStatus(false);
      }
    });

    // 3. Lắng nghe storage event (đáp ứng tức thì trong <1ms khi Admin duyệt ở tab/cửa sổ khác)
    this.storageEventListener = (event: StorageEvent) => {
      if (event.key === 'vic_seller_onboarding_draft' || !event.key) {
        this.onboardingService.syncFromStorage();
        this.refreshStatus(false);
      }
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.storageEventListener);
    }
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    if (this.storageEventListener && typeof window !== 'undefined') {
      window.removeEventListener('storage', this.storageEventListener);
    }
  }

  manualRefresh(): void {
    this.refreshStatus(true);
  }

  private refreshStatus(isManual: boolean): void {
    if (this.isRefreshing()) return;
    if (isManual) this.isRefreshing.set(true);

    this.onboardingService.fetchCurrentStatusFromServer().subscribe({
      next: () => {
        this.updateLastCheckedTime();
        if (isManual) this.isRefreshing.set(false);

        const newStatus = this.status();
        if (this.prevStatus && this.prevStatus !== newStatus) {
          this.handleStatusTransition(this.prevStatus, newStatus);
        }
        this.prevStatus = newStatus;
      },
      error: () => {
        if (isManual) this.isRefreshing.set(false);
      },
    });
  }

  private handleStatusTransition(oldStatus: ApplicationStatus, newStatus: ApplicationStatus): void {
    if (newStatus === 'APPROVED') {
      this.toastService.success('🎉 Chúc mừng bạn! Hồ sơ gian hàng đã được Ban quản trị phê duyệt thành công!');
    } else if (newStatus === 'REJECTED') {
      this.toastService.error('Hồ sơ đăng ký của bạn không được phê duyệt. Vui lòng xem lý do và cập nhật lại.');
    } else if (newStatus === 'REVISION_NEEDED') {
      this.toastService.info('Ban quản trị yêu cầu bổ sung thông tin cho hồ sơ gian hàng.');
    }
  }

  private updateLastCheckedTime(): void {
    const d = new Date();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    this.lastCheckedTime.set(`${h}:${m}:${s}`);
  }

  onContinueDraft(): void {
    this.router.navigate(['/seller/register'], { queryParams: { mode: 'edit' } });
  }

  onFixRevision(): void {
    this.router.navigate(['/seller/revision']);
  }

  onRetry(): void {
    this.router.navigate(['/seller/register'], { queryParams: { mode: 'edit' } });
  }

  onGoToSellerCenter(): void {
    this.router.navigate(['/seller/dashboard']);
  }
}

