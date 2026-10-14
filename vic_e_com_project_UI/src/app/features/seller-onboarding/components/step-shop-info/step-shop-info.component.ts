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
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((name) => {
      this.performNameCheck(name);
    });

    if (this.shopInfo.shopName) {
      this.nameCheckStatus.set('AVAILABLE');
      this.nameCheckMessage.set('Tên gian hàng hợp lệ');
    }
  }

  onNameInput(value: string): void {
    this.shopInfo.shopName = value;
    this.emitChange();
    if (value.trim().length >= 3) {
      this.isCheckingName.set(true);
      this.nameCheckSubject.next(value);
    } else {
      this.nameCheckStatus.set('NONE');
      this.nameCheckMessage.set('');
    }
  }

  private performNameCheck(name: string): void {
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

  emitChange(): void {
    this.shopInfoChange.emit({ ...this.shopInfo });
  }

  onContinue(): void {
    if (!this.shopInfo.shopName || this.nameCheckStatus() === 'TAKEN') {
      return;
    }
    this.next.emit();
  }
}
