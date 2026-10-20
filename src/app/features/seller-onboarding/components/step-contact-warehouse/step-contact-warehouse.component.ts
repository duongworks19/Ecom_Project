import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactWarehouseInfo } from '../../models/seller-onboarding.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-step-contact-warehouse',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './step-contact-warehouse.component.html',
  styleUrl: './step-contact-warehouse.component.scss',
})
export class StepContactWarehouseComponent {
  @Input({ required: true }) contactInfo!: ContactWarehouseInfo;
  @Input() readOnly = false;
  @Output() contactInfoChange = new EventEmitter<ContactWarehouseInfo>();
  @Output() next = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  private readonly authService = inject(AuthService);
  readonly isLoggedIn = this.authService.isLoggedInSignal;

  showPassword = false;
  showConfirmPassword = false;

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

  get availableDistricts(): string[] {
    return this.districts[this.contactInfo.province] || ['Quận/Huyện trung tâm'];
  }

  get availableWards(): string[] {
    return this.wards[this.contactInfo.district] || ['Phường/Xã trung tâm'];
  }

  toggleShowPassword(): void {
    this.showPassword = !this.showPassword;
  }

  toggleShowConfirmPassword(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  get isPasswordLengthValid(): boolean {
    const pwd = this.contactInfo.password?.trim() || '';
    if (this.isLoggedIn() && !pwd) return true;
    return pwd.length >= 6;
  }

  get isPasswordMatched(): boolean {
    const pwd = this.contactInfo.password || '';
    const confirm = this.contactInfo.confirmPassword || '';
    if (this.isLoggedIn() && !pwd && !confirm) return true;
    return pwd === confirm;
  }

  onProvinceChange(): void {
    const districts = this.availableDistricts;
    this.contactInfo.district = districts[0] || '';
    this.onDistrictChange();
  }

  onDistrictChange(): void {
    const wards = this.availableWards;
    this.contactInfo.ward = wards[0] || '';
    this.emitChange();
  }

  emitChange(): void {
    this.contactInfoChange.emit({ ...this.contactInfo });
  }

  isValid(): boolean {
    const basicValid = !!(
      this.contactInfo.representativeName?.trim() &&
      this.contactInfo.phone?.trim() &&
      this.contactInfo.email?.trim() &&
      this.contactInfo.detailedAddress?.trim()
    );

    if (!basicValid) return false;

    // Nếu đã đăng nhập và không đổi mật khẩu thì hợp lệ
    if (this.isLoggedIn() && !this.contactInfo.password) {
      return true;
    }

    return this.isPasswordLengthValid && this.isPasswordMatched;
  }

  onContinue(): void {
    if (!this.isValid()) return;
    this.next.emit();
  }
}
