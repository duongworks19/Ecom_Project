import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { StepShopInfoComponent } from '../../components/step-shop-info/step-shop-info.component';
import { StepContactWarehouseComponent } from '../../components/step-contact-warehouse/step-contact-warehouse.component';
import { StepKycComponent } from '../../components/step-kyc/step-kyc.component';
import { StepReviewComponent } from '../../components/step-review/step-review.component';
import { ShopInfo, ContactWarehouseInfo, KycInfo } from '../../models/seller-onboarding.model';

@Component({
  selector: 'app-seller-wizard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    StepShopInfoComponent,
    StepContactWarehouseComponent,
    StepKycComponent,
    StepReviewComponent,
  ],
  templateUrl: './seller-wizard.component.html',
  styleUrl: './seller-wizard.component.scss',
})
export class SellerWizardComponent implements OnInit {
  private readonly onboardingService = inject(SellerOnboardingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);

  readonly currentStep = signal<number>(1);
  readonly applicationData = this.onboardingService.application;
  readonly isSavingDraft = this.onboardingService.isSavingDraft;
  readonly isSubmitting = this.onboardingService.isSubmitting;
  readonly submissionError = this.onboardingService.submissionError;

  ngOnInit(): void {
    const isEdit = this.route.snapshot.queryParamMap.get('mode') === 'edit';
    if (isEdit) {
      this.router.navigate(['/seller/revision']);
      return;
    }
    this.onboardingService.resetApplication();
    this.currentStep.set(1);
    this.onboardingService.clearSubmissionError();
  }

  onShopInfoChange(info: ShopInfo): void {
    this.onboardingService.clearSubmissionError();
    this.onboardingService.updateShopInfo(info);
  }

  onContactInfoChange(info: ContactWarehouseInfo): void {
    this.onboardingService.clearSubmissionError();
    this.onboardingService.updateContactInfo(info);
  }

  onKycInfoChange(info: KycInfo): void {
    this.onboardingService.clearSubmissionError();
    this.onboardingService.updateKycInfo(info);
  }

  onResetForm(): void {
    if (confirm('Bạn có chắc muốn xóa sạch toàn bộ dữ liệu đã nhập để điền lại từ đầu không?')) {
      this.onboardingService.resetApplication();
      this.currentStep.set(1);
    }
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 4) {
      this.onboardingService.clearSubmissionError();
      this.currentStep.set(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSubmitApplication(): void {
    this.onboardingService.submitApplication().subscribe({
      next: (res) => {
        if (res.success) {
          this.toastService.success('Đã nộp hồ sơ đăng ký thành công! Đang chuyển hướng...');
          setTimeout(() => {
            this.router.navigate(['/seller/status']);
          }, 600);
        } else {
          const msg = res.message || 'Thông tin bị trùng hoặc không hợp lệ. Vui lòng kiểm tra lại!';
          this.toastService.error(msg);
        }
      },
      error: (err) => {
        const msg = err?.error?.message || 'Có lỗi xảy ra khi nộp hồ sơ. Vui lòng kiểm tra lại!';
        this.toastService.error(msg);
      },
    });
  }
}
