import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';
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
export class SellerWizardComponent {
  private readonly onboardingService = inject(SellerOnboardingService);
  private readonly router = inject(Router);

  readonly currentStep = signal<number>(1);
  readonly applicationData = this.onboardingService.application;
  readonly isSavingDraft = this.onboardingService.isSavingDraft;
  readonly isSubmitting = this.onboardingService.isSubmitting;

  onShopInfoChange(info: ShopInfo): void {
    this.onboardingService.updateShopInfo(info);
  }

  onContactInfoChange(info: ContactWarehouseInfo): void {
    this.onboardingService.updateContactInfo(info);
  }

  onKycInfoChange(info: KycInfo): void {
    this.onboardingService.updateKycInfo(info);
  }

  goToStep(step: number): void {
    if (step >= 1 && step <= 4) {
      this.currentStep.set(step);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onSubmitApplication(): void {
    this.onboardingService.submitApplication().subscribe({
      next: (success) => {
        if (success) {
          this.router.navigate(['/seller/status']);
        }
      },
    });
  }
}
