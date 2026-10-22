import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerShopProfile } from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-profile.component.html',
  styleUrl: './seller-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProfileComponent {
  readonly profile = input.required<SellerShopProfile>();
  readonly saveProfile = output<SellerShopProfile>();

  form = {
    shopName: '',
    phone: '',
    email: '',
    businessHours: '08:00 – 21:00',
    description: '',
    pickupAddress: '',
  };

  readonly formError = signal<string | null>(null);

  constructor() {
    effect(() => {
      const p = this.profile();
      if (p) {
        this.form = {
          shopName: p.shopName || '',
          phone: p.phone || '',
          email: p.email || '',
          businessHours: p.businessHours || '08:00 – 21:00',
          description: p.description || '',
          pickupAddress: p.pickupAddress || '',
        };
      }
    });
  }

  onSubmit(): void {
    const name = this.form.shopName.trim();
    const phone = this.form.phone.trim().replace(/\s/g, '');
    const addr = this.form.pickupAddress.trim();

    if (name.length < 3 || name.length > 50) {
      this.formError.set('Tên gian hàng từ 3–50 ký tự.');
      return;
    }
    if (!/^0\d{9}$/.test(phone)) {
      this.formError.set('Số điện thoại gồm 10 số, bắt đầu bằng 0.');
      return;
    }
    if (addr.length < 10) {
      this.formError.set('Nhập địa chỉ kho lấy hàng đầy đủ (tối thiểu 10 ký tự).');
      return;
    }

    this.formError.set(null);
    this.saveProfile.emit({
      ...this.profile(),
      shopName: name,
      phone,
      email: this.form.email.trim(),
      businessHours: this.form.businessHours.trim(),
      description: this.form.description.trim(),
      pickupAddress: addr,
    });
  }
}
