import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { ContactWarehouseInfo } from '../../models/seller-onboarding.model';
<<<<<<< Updated upstream
import {
  VIETNAM_34_PROVINCES,
  VIETNAM_DISTRICTS_MAP,
  VIETNAM_WARDS_MAP,
} from '../../constants/vietnam-divisions.constant';
=======
import { SellerOnboardingService } from '../../services/seller-onboarding.service';
>>>>>>> Stashed changes

@Component({
  selector: 'app-step-contact-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-contact-warehouse.component.html',
  styleUrl: './step-contact-warehouse.component.scss',
})
export class StepContactWarehouseComponent implements OnInit {
  private readonly onboardingService = inject(SellerOnboardingService);

  @Input({ required: true }) contactInfo!: ContactWarehouseInfo;
  @Input() readOnly = false;
  @Output() contactInfoChange = new EventEmitter<ContactWarehouseInfo>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

<<<<<<< Updated upstream
  readonly provinces = VIETNAM_34_PROVINCES;
  readonly districts = VIETNAM_DISTRICTS_MAP;
  readonly wards = VIETNAM_WARDS_MAP;
=======
  // Reactive email check
  readonly emailCheckSubject = new Subject<string>();
  readonly isCheckingEmail = signal<boolean>(false);
  readonly emailCheckStatus = signal<'NONE' | 'AVAILABLE' | 'TAKEN'>('NONE');
  readonly emailCheckMessage = signal<string>('');

  readonly provinces = ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng', 'Hải Phòng', 'Cần Thơ', 'Bình Dương'];

  readonly districts: Record<string, string[]> = {
    'Hà Nội': ['Quận Cầu Giấy', 'Quận Đống Đa', 'Quận Ba Đình', 'Quận Hai Bà Trưng', 'Quận Nam Từ Liêm'],
    'TP. Hồ Chí Minh': ['Quận 1', 'Quận 3', 'Quận 7', 'Quận Bình Thạnh', 'TP. Thủ Đức'],
    'Đà Nẵng': ['Quận Hải Châu', 'Quận Thanh Khê', 'Quận Sơn Trà'],
    'Hải Phòng': ['Quận Hồng Bàng', 'Quận Ngô Quyền', 'Quận Lê Chân'],
    'Cần Thơ': ['Quận Ninh Kiều', 'Quận Cái Răng', 'Quận Bình Thủy'],
    'Bình Dương': ['TP. Thủ Dầu Một', 'TP. Dĩ An', 'TP. Thuận An'],
  };

  readonly wards: Record<string, string[]> = {
    'Quận Cầu Giấy': ['Phường Dịch Vọng Hậu', 'Phường Dịch Vọng', 'Phường Nghĩa Đô', 'Phường Mai Dịch'],
    'Quận Đống Đa': ['Phường Láng Hạ', 'Phường Ô Chợ Dừa', 'Phường Kim Liên'],
    'Quận 1': ['Phường Bến Nghé', 'Phường Bến Thành', 'Phường Tân Định'],
    'TP. Thủ Đức': ['Phường Thảo Điền', 'Phường An Phú', 'Phường Hiệp Phú'],
  };
>>>>>>> Stashed changes

  ngOnInit(): void {
    this.emailCheckSubject.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe((email) => {
      this.performEmailCheck(email);
    });

    if (this.contactInfo.email && this.contactInfo.email.trim()) {
      this.performEmailCheck(this.contactInfo.email.trim());
    }
  }

  onEmailInput(value: string): void {
    this.contactInfo.email = value;
    this.emitChange();
    const trimmed = (value || '').trim();
    if (trimmed && this.isValidEmail(trimmed)) {
      this.isCheckingEmail.set(true);
      this.emailCheckSubject.next(trimmed);
    } else {
      this.isCheckingEmail.set(false);
      this.emailCheckStatus.set(trimmed ? 'TAKEN' : 'NONE');
      this.emailCheckMessage.set(trimmed ? 'Định dạng email không hợp lệ' : '');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  }

  private performEmailCheck(email: string): void {
    if (!this.isValidEmail(email)) {
      this.isCheckingEmail.set(false);
      this.emailCheckStatus.set('TAKEN');
      this.emailCheckMessage.set('Định dạng email không hợp lệ');
      return;
    }

    this.isCheckingEmail.set(true);
    this.onboardingService.checkEmailAvailable(email).subscribe({
      next: (res) => {
        this.isCheckingEmail.set(false);
        this.emailCheckStatus.set(res.isAvailable ? 'AVAILABLE' : 'TAKEN');
        this.emailCheckMessage.set(res.message);
      },
      error: () => {
        this.isCheckingEmail.set(false);
      },
    });
  }

  get availableDistricts(): string[] {
    if (!this.contactInfo.province) return [];
    const found = this.districts[this.contactInfo.province];
    if (found && found.length > 0) return found;

    // Fallback chuẩn theo tên tỉnh nếu có tiền tố "Thành phố" hoặc "Tỉnh"
    const cleaned = this.contactInfo.province.replace(/^(Thành phố|Tỉnh|TP\.)\s*/i, '').trim();
    for (const [key, val] of Object.entries(this.districts)) {
      if (key.includes(cleaned) || cleaned.includes(key)) {
        return val;
      }
    }
    return ['Quận/Huyện trung tâm', 'Thành phố trung tâm', 'Huyện ngoại thành'];
  }

  get availableWards(): string[] {
    if (!this.contactInfo.district) return [];
    const direct = this.wards[this.contactInfo.district];
    if (direct && direct.length > 0) return direct;

    // Fallback theo loại đơn vị hành chính
    const d = this.contactInfo.district;
    if (d.startsWith('Huyện')) {
      const name = d.replace(/^Huyện\s*/i, '').trim();
      return [
        `Thị trấn ${name}`,
        `Xã ${name} Đông`,
        `Xã ${name} Tây`,
        `Xã ${name} Nam`,
        `Xã ${name} Bắc`,
        'Xã Trung Tâm',
        'Xã An Bình',
        'Xã Tân Hiệp',
      ];
    }
    return [
      'Phường 1',
      'Phường 2',
      'Phường 3',
      'Phường 4',
      'Phường 5',
      'Phường Trung Tâm',
      'Phường An Hòa',
      'Phường Tân Bình',
    ];
  }

  onProvinceChange(): void {
    this.contactInfo.district = '';
    this.contactInfo.ward = '';
    this.emitChange();
  }

  onDistrictChange(): void {
    this.contactInfo.ward = '';
    this.emitChange();
  }

  emitChange(): void {
    this.contactInfoChange.emit({ ...this.contactInfo });
  }

  isValid(): boolean {
    return !!(
      this.contactInfo.representativeName?.trim() &&
      this.contactInfo.phone?.trim() &&
      this.contactInfo.email?.trim() &&
<<<<<<< Updated upstream
      this.contactInfo.province?.trim() &&
      this.contactInfo.district?.trim() &&
      this.contactInfo.ward?.trim() &&
=======
      this.emailCheckStatus() !== 'TAKEN' &&
      !this.isCheckingEmail() &&
>>>>>>> Stashed changes
      this.contactInfo.detailedAddress?.trim()
    );
  }

  onContinue(): void {
    if (!this.isValid()) return;
    this.next.emit();
  }
}
