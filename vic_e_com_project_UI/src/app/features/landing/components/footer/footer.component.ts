import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { SellerOnboardingService } from '../../../seller-onboarding/services/seller-onboarding.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent {
  readonly authService = inject(AuthService);
  readonly onboardingService = inject(SellerOnboardingService);

  /**
   * Chỉ hiển thị các mục liên quan đến Shop/Kênh người bán khi:
   * - Tài khoản đã đăng ký shop và đang chờ duyệt (PENDING, REVISION_NEEDED)
   * - Hoặc đã được duyệt mở shop (ROLE_VENDOR / APPROVED)
   * Khách hàng thông thường / người mới tạo tài khoản để mua hàng sẽ không thấy.
   */
  readonly hasRegisteredShop = computed(() => {
    // 1. Chưa đăng nhập -> người dùng vãng lai
    if (!this.authService.isLoggedInSignal()) {
      return false;
    }

    // 2. Đã là Vendor (shop đã được duyệt)
    const role = this.authService.currentRoleSignal()?.toUpperCase();
    if (role === 'VENDOR' || role === 'ROLE_VENDOR') {
      return true;
    }

    // 3. Trạng thái hồ sơ đã gửi hoặc đang chờ duyệt/bổ sung
    const status = this.onboardingService.currentStatus();
    if (status === 'PENDING' || status === 'REVISION_NEEDED' || status === 'APPROVED') {
      return true;
    }

    // 4. Kiểm tra dữ liệu nháp/hồ sơ đã nộp trong localStorage
    try {
      const rawDraft = localStorage.getItem('vic_seller_onboarding_draft');
      if (rawDraft) {
        const draft = JSON.parse(rawDraft);
        if (draft?.status === 'PENDING' || draft?.status === 'REVISION_NEEDED' || draft?.status === 'APPROVED') {
          return true;
        }
      }
      const rawApps = localStorage.getItem('vic_admin_vendor_applications_v2');
      if (rawApps) {
        const apps = JSON.parse(rawApps);
        if (Array.isArray(apps) && apps.some((a: any) => a.isUserSubmitted)) {
          return true;
        }
      }
    } catch {
      // ignore
    }

    return false;
  });
}
