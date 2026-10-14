import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';
import { StatusTimelineComponent } from '../../components/status-timeline/status-timeline.component';
import { ApplicationStatus } from '../../models/seller-onboarding.model';

@Component({
  selector: 'app-seller-status',
  standalone: true,
  imports: [CommonModule, RouterLink, StatusTimelineComponent],
  templateUrl: './seller-status.component.html',
  styleUrl: './seller-status.component.scss',
})
export class SellerStatusComponent {
  private readonly onboardingService = inject(SellerOnboardingService);
  private readonly router = inject(Router);

  readonly applicationData = this.onboardingService.application;
  readonly status = this.onboardingService.currentStatus;

  onContinueDraft(): void {
    this.router.navigate(['/seller/register']);
  }

  onFixRevision(): void {
    this.router.navigate(['/seller/register']);
  }

  onRetry(): void {
    this.onboardingService.setDemoStatus('DRAFT');
    this.router.navigate(['/seller/register']);
  }

  onGoToSellerCenter(): void {
    // Chuyển hướng sang Seller Center Dashboard
    this.router.navigate(['/seller/dashboard']);
  }

  /**
   * Bộ chuyển đổi trạng thái thử nghiệm (Demo switcher)
   */
  simulateStatus(newStatus: ApplicationStatus): void {
    let feedback = '';
    if (newStatus === 'REVISION_NEEDED') {
      feedback = 'Ảnh mặt sau CCCD bị lóa ánh sáng đèn, không nhận diện được số vân tay. Vui lòng chụp lại ảnh rõ nét.';
    } else if (newStatus === 'REJECTED') {
      feedback = 'Mặt hàng dự kiến kinh doanh nằm trong danh mục cấm hoặc vi phạm bản quyền thương hiệu.';
    }
    this.onboardingService.setDemoStatus(newStatus, feedback);
  }
}
