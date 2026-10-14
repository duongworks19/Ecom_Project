import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KycInfo, BusinessType } from '../../models/seller-onboarding.model';

@Component({
  selector: 'app-step-kyc',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-kyc.component.html',
  styleUrl: './step-kyc.component.scss',
})
export class StepKycComponent {
  @Input({ required: true }) kycInfo!: KycInfo;
  @Input({ required: true }) businessType!: BusinessType;
  @Input() readOnly = false;
  @Output() kycInfoChange = new EventEmitter<KycInfo>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  readonly popularBanks = [
    'Vietcombank',
    'Techcombank',
    'MB Bank (Quân Đội)',
    'VietinBank',
    'BIDV',
    'VPBank',
    'ACB (Á Châu)',
    'TPBank',
    'Sacombank',
    'HDBank',
  ];

  onFrontImageUpload(event: Event): void {
    if (this.readOnly) return;
    this.handleFileUpload(event, (url) => {
      this.kycInfo.idCardFrontUrl = url;
      this.emitChange();
    });
  }

  onBackImageUpload(event: Event): void {
    if (this.readOnly) return;
    this.handleFileUpload(event, (url) => {
      this.kycInfo.idCardBackUrl = url;
      this.emitChange();
    });
  }

  onLicenseUpload(event: Event): void {
    if (this.readOnly) return;
    this.handleFileUpload(event, (url) => {
      this.kycInfo.businessLicenseUrl = url;
      this.emitChange();
    });
  }

  private handleFileUpload(event: Event, callback: (base64: string) => void): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        callback(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onAccountNameInput(val: string): void {
    // Tự động viết hoa không dấu
    this.kycInfo.bankAccountName = val.toUpperCase();
    this.emitChange();
  }

  emitChange(): void {
    this.kycInfoChange.emit({ ...this.kycInfo });
  }

  isValid(): boolean {
    const hasId = !!(
      this.kycInfo.idCardNumber?.trim() &&
      this.kycInfo.idCardFrontUrl &&
      this.kycInfo.idCardBackUrl
    );

    const hasBank = !!(
      this.kycInfo.bankName &&
      this.kycInfo.bankAccountNumber?.trim() &&
      this.kycInfo.bankAccountName?.trim()
    );

    const isCompanyOrHousehold = this.businessType === 'COMPANY' || this.businessType === 'HOUSEHOLD';
    const hasLicenseIfRequired = !isCompanyOrHousehold || !!this.kycInfo.businessLicenseUrl;

    return hasId && hasBank && hasLicenseIfRequired;
  }

  onContinue(): void {
    if (!this.isValid()) return;
    this.next.emit();
  }
}
