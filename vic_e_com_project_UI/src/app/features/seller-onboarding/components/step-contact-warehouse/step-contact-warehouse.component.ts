import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactWarehouseInfo } from '../../models/seller-onboarding.model';
import {
  VIETNAM_34_PROVINCES,
  VIETNAM_DISTRICTS_MAP,
  VIETNAM_WARDS_MAP,
} from '../../constants/vietnam-divisions.constant';

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

  readonly provinces = VIETNAM_34_PROVINCES;
  readonly districts = VIETNAM_DISTRICTS_MAP;
  readonly wards = VIETNAM_WARDS_MAP;

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
      this.contactInfo.province?.trim() &&
      this.contactInfo.district?.trim() &&
      this.contactInfo.ward?.trim() &&
      this.contactInfo.detailedAddress?.trim()
    );
  }

  onContinue(): void {
    if (!this.isValid()) return;
    this.next.emit();
  }
}
