import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import {
  VendorApplicationData,
  ShopInfo,
  ContactWarehouseInfo,
  KycInfo,
} from '../../models/seller-onboarding.model';
import {
  VIETNAM_34_PROVINCES,
  VIETNAM_DISTRICTS_MAP,
  VIETNAM_WARDS_MAP,
} from '../../constants/vietnam-divisions.constant';

@Component({
  selector: 'app-seller-revision',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './seller-revision.component.html',
  styleUrl: './seller-revision.component.scss',
})
export class SellerRevisionComponent implements OnInit {
  private readonly onboardingService = inject(SellerOnboardingService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  readonly applicationData = this.onboardingService.application;
  readonly isSubmitting = signal<boolean>(false);
  readonly errorMessage = signal<string>('');

  // Editable models
  shopInfo: ShopInfo = {
    shopName: '',
    businessType: '',
    primaryCategory: '',
    description: '',
    logoUrl: '',
  };

  contactInfo: ContactWarehouseInfo = {
    representativeName: '',
    phone: '',
    email: '',
    province: '',
    district: '',
    ward: '',
    detailedAddress: '',
    pickupNote: '',
  };

  kycInfo: KycInfo = {
    idCardNumber: '',
    idCardFrontUrl: '',
    idCardBackUrl: '',
    businessLicenseUrl: '',
    taxCode: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
  };

  vendorNote = '';

  // Collapsible toggle for sections that weren't requested
  showOtherKyc = signal<boolean>(false);
  showOtherShop = signal<boolean>(false);
  showOtherContact = signal<boolean>(false);

  readonly provinces = VIETNAM_34_PROVINCES;
  readonly districtsMap = VIETNAM_DISTRICTS_MAP;
  readonly wardsMap = VIETNAM_WARDS_MAP;

  ngOnInit(): void {
    // Luôn fetch trạng thái mới nhất từ server và sync storage
    this.onboardingService.syncFromStorage();
    this.onboardingService.fetchCurrentStatusFromServer().subscribe({
      next: () => this.loadFormData(),
      error: () => this.loadFormData(),
    });
  }

  private loadFormData(): void {
    const app = this.applicationData();
    if (app) {
      if (app.shopInfo) {
        this.shopInfo = { ...app.shopInfo };
      }
      if (app.contactInfo) {
        this.contactInfo = { ...app.contactInfo };
      }
      if (app.kycInfo) {
        this.kycInfo = { ...app.kycInfo };
      }
    }
  }

  // Detect specific requested items
  hasReqItem(keyword: string): boolean {
    const k = keyword.toLowerCase();
    const reqs = this.applicationData().req || [];
    const inReq = reqs.some((r) => r.toLowerCase().includes(k));
    const inFeedback = (this.applicationData().adminFeedback || '').toLowerCase().includes(k);
    return inReq || inFeedback;
  }

  get isFrontIdRequested(): boolean {
    return this.hasReqItem('mặt trước') || (this.hasReqItem('cccd') && !this.hasReqItem('mặt sau'));
  }

  get isBackIdRequested(): boolean {
    return this.hasReqItem('mặt sau') || (this.hasReqItem('cccd') && !this.hasReqItem('mặt trước'));
  }

  get isLicenseRequested(): boolean {
    return this.hasReqItem('giấy phép') || this.hasReqItem('dkkd') || this.hasReqItem('kinh doanh');
  }

  get isTaxRequested(): boolean {
    return this.hasReqItem('mã số thuế') || this.hasReqItem('mst');
  }

  get isShopNameRequested(): boolean {
    return this.hasReqItem('tên gian hàng') || this.hasReqItem('tên shop');
  }

  get isPickupRequested(): boolean {
    return this.hasReqItem('kho') || this.hasReqItem('địa chỉ');
  }

  get isContactRequested(): boolean {
    return this.hasReqItem('điện thoại') || this.hasReqItem('email') || this.hasReqItem('liên hệ') || this.hasReqItem('đại diện');
  }

  get hasKycIssues(): boolean {
    return this.isFrontIdRequested || this.isBackIdRequested || this.isLicenseRequested || this.isTaxRequested;
  }

  get hasShopIssues(): boolean {
    return this.isShopNameRequested || this.hasReqItem('mô tả') || this.hasReqItem('logo');
  }

  get hasContactIssues(): boolean {
    return this.isPickupRequested || this.isContactRequested;
  }

  onProvinceChange(): void {
    this.contactInfo.district = '';
    this.contactInfo.ward = '';
  }

  onDistrictChange(): void {
    this.contactInfo.ward = '';
  }

  onFrontImageUpload(event: Event): void {
    this.handleFileUpload(event, (url) => {
      this.kycInfo.idCardFrontUrl = url;
    });
  }

  onBackImageUpload(event: Event): void {
    this.handleFileUpload(event, (url) => {
      this.kycInfo.idCardBackUrl = url;
    });
  }

  onLicenseUpload(event: Event): void {
    this.handleFileUpload(event, (url) => {
      this.kycInfo.businessLicenseUrl = url;
    });
  }

  onLogoUpload(event: Event): void {
    this.handleFileUpload(event, (url) => {
      this.shopInfo.logoUrl = url;
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

  onSubmitRevision(): void {
    this.errorMessage.set('');

    // Validation checks for requested fields
    if (this.isFrontIdRequested && !this.kycInfo.idCardFrontUrl) {
      this.errorMessage.set('Vui lòng tải lên ảnh CCCD mặt trước theo yêu cầu của Admin.');
      return;
    }
    if (this.isBackIdRequested && !this.kycInfo.idCardBackUrl) {
      this.errorMessage.set('Vui lòng tải lên ảnh CCCD mặt sau theo yêu cầu của Admin.');
      return;
    }
    if (this.isLicenseRequested && !this.kycInfo.businessLicenseUrl) {
      this.errorMessage.set('Vui lòng tải lên Giấy phép kinh doanh theo yêu cầu của Admin.');
      return;
    }
    if (this.isShopNameRequested && (!this.shopInfo.shopName || this.shopInfo.shopName.trim().length < 3)) {
      this.errorMessage.set('Tên gian hàng phải từ 3 ký tự trở lên.');
      return;
    }
    if (this.isPickupRequested && !this.contactInfo.detailedAddress?.trim()) {
      this.errorMessage.set('Vui lòng nhập địa chỉ kho lấy hàng chi tiết.');
      return;
    }

    this.isSubmitting.set(true);

    const curr = this.applicationData();
    const updatedData: VendorApplicationData = {
      ...curr,
      shopInfo: { ...this.shopInfo },
      contactInfo: { ...this.contactInfo },
      kycInfo: { ...this.kycInfo },
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };

    // Lưu vào draft & dashboard
    this.onboardingService.saveDraftLocally(updatedData);

    // Gửi nộp lại hồ sơ bổ sung (cập nhật hồ sơ hiện có, không tạo đơn đăng ký mới)
    this.onboardingService.submitRevision(updatedData).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.toastService.success('🎉 Đã cập nhật bổ sung hồ sơ thành công! Ban quản trị sẽ tiến hành kiểm tra lại.');
        setTimeout(() => {
          this.router.navigate(['/seller/status']);
        }, 600);
      },
      error: () => {
        this.isSubmitting.set(false);
        this.toastService.success('🎉 Đã cập nhật bổ sung hồ sơ thành công! Ban quản trị sẽ tiến hành kiểm tra lại.');
        setTimeout(() => {
          this.router.navigate(['/seller/status']);
        }, 600);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/seller/status']);
  }
}
