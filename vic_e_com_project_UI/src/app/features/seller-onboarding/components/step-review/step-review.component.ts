import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendorApplicationData } from '../../models/seller-onboarding.model';

@Component({
  selector: 'app-step-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-review.component.html',
  styleUrl: './step-review.component.scss',
})
export class StepReviewComponent {
  @Input({ required: true }) data!: VendorApplicationData;
  @Input() isSubmitting = false;
  @Output() jumpToStep = new EventEmitter<number>();
  @Output() submitApplication = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  agreeTerms = false;
  commitTruth = false;

  maskIdCard(id: string): string {
    if (!id || id.length < 6) return id;
    const start = id.substring(0, 4);
    const end = id.substring(id.length - 2);
    return `${start}******${end}`;
  }

  maskBankAccount(acc: string): string {
    if (!acc || acc.length < 5) return acc;
    const start = acc.substring(0, 4);
    const end = acc.substring(acc.length - 2);
    return `${start}******${end}`;
  }

  get businessTypeLabel(): string {
    switch (this.data.shopInfo.businessType) {
      case 'INDIVIDUAL':
        return 'Cá nhân';
      case 'HOUSEHOLD':
        return 'Hộ kinh doanh';
      case 'COMPANY':
        return 'Công ty / Doanh nghiệp';
      default:
        return 'Chưa chọn';
    }
  }

  canSubmit(): boolean {
    return this.agreeTerms && this.commitTruth && !this.isSubmitting;
  }

  onSubmit(): void {
    if (!this.canSubmit()) return;
    this.submitApplication.emit();
  }
}
