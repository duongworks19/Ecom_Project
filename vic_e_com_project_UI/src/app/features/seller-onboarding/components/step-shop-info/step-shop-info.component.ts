import { Component, EventEmitter, Input, Output, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ShopInfo, BusinessType } from '../../models/seller-onboarding.model';
import { SellerOnboardingService } from '../../services/seller-onboarding.service';

@Component({
  selector: 'app-step-shop-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-shop-info.component.html',
  styleUrl: './step-shop-info.component.scss',
})
export class StepShopInfoComponent implements OnInit {
  private readonly onboardingService = inject(SellerOnboardingService);

  @Input({ required: true }) shopInfo!: ShopInfo;
  @Input() readOnly = false;
  @Output() shopInfoChange = new EventEmitter<ShopInfo>();
  @Output() next = new EventEmitter<void>();

  // Check shop name reactive state
  readonly nameCheckSubject = new Subject<string>();
  readonly isCheckingName = signal<boolean>(false);
  readonly nameCheckStatus = signal<'NONE' | 'AVAILABLE' | 'TAKEN'>('NONE');
  readonly nameCheckMessage = signal<string>('');

  readonly categories = [
    'Thời trang & Phụ kiện',
    'Mỹ phẩm & Chăm sóc sắc đẹp',
    'Điện thoại & Đồ công nghệ',
    'Nhà cửa & Đời sống',
    'Thực phẩm & Đồ uống',
    'Mẹ & Bé',
    'Sách & Văn phòng phẩm',
    'Thể thao & Dã ngoại',
  ];

  ngOnInit(): void {
    this.nameCheckSubject.pipe(
      debounceTime(350),
      distinctUntilChanged()
    ).subscribe((name) => {
      this.performNameCheck(name);
    });

    if (this.shopInfo.shopName && this.shopInfo.shopName.trim()) {
      this.performNameCheck(this.shopInfo.shopName.trim());
    } else {
      this.isCheckingName.set(false);
      this.nameCheckStatus.set('NONE');
      this.nameCheckMessage.set('');
    }
  }

  onNameInput(value: string): void {
    this.shopInfo.shopName = value;
    this.emitChange();
    const trimmed = (value || '').trim();

    if (!trimmed) {
      this.isCheckingName.set(false);
      this.nameCheckStatus.set('NONE');
      this.nameCheckMessage.set('');
      return;
    }

    if (trimmed.length < 3) {
      this.isCheckingName.set(false);
      this.nameCheckStatus.set('TAKEN');
      this.nameCheckMessage.set('Tên gian hàng phải từ 3 ký tự trở lên');
      return;
    }

    if (trimmed.length > 50) {
      this.isCheckingName.set(false);
      this.nameCheckStatus.set('TAKEN');
      this.nameCheckMessage.set('Tên gian hàng không được vượt quá 50 ký tự');
      return;
    }

    // Kiểm tra nhanh phía client từ nhạy cảm / cấm để hiển thị lỗi ngay lập tức
    const clientCheck = this.onboardingService.validateSensitiveAndReservedLocal(trimmed);
    if (!clientCheck.isAvailable) {
      this.isCheckingName.set(false);
      this.nameCheckStatus.set('TAKEN');
      this.nameCheckMessage.set(clientCheck.message);
      return;
    }

    // Nếu hợp lệ client -> gửi debounce gọi API kiểm tra trùng tên database
    this.isCheckingName.set(true);
    this.nameCheckSubject.next(trimmed);
  }

  private performNameCheck(name: string): void {
    const clientCheck = this.onboardingService.validateSensitiveAndReservedLocal(name);
    if (!clientCheck.isAvailable) {
      this.isCheckingName.set(false);
      this.nameCheckStatus.set('TAKEN');
      this.nameCheckMessage.set(clientCheck.message);
      return;
    }

    this.isCheckingName.set(true);
    this.onboardingService.checkShopNameAvailable(name).subscribe({
      next: (res) => {
        this.isCheckingName.set(false);
        this.nameCheckStatus.set(res.isAvailable ? 'AVAILABLE' : 'TAKEN');
        this.nameCheckMessage.set(res.message);
      },
      error: () => {
        this.isCheckingName.set(false);
      },
    });
  }

  selectBusinessType(type: BusinessType): void {
    if (this.readOnly) return;
    this.shopInfo.businessType = type;
    this.emitChange();
  }

  selectCategory(cat: string): void {
    if (this.readOnly) return;
    this.shopInfo.primaryCategory = cat;
    this.emitChange();
  }

  onLogoUpload(event: Event): void {
    if (this.readOnly) return;
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.shopInfo.logoUrl = e.target?.result as string;
        this.emitChange();
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    if (this.readOnly) return;
    this.shopInfo.logoUrl = '';
    this.emitChange();
  }

  emitChange(): void {
    this.shopInfoChange.emit({ ...this.shopInfo });
  }

  isStepValid(): boolean {
    return !!(
      this.shopInfo.shopName?.trim() &&
      this.nameCheckStatus() === 'AVAILABLE' &&
      !this.isCheckingName() &&
      this.shopInfo.businessType &&
      this.shopInfo.primaryCategory
    );
  }

  onContinue(): void {
    if (!this.isStepValid()) {
      return;
    }
    this.next.emit();
  }
}
