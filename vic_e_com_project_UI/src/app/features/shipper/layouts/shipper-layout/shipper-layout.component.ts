import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ShipperPortalService } from '../../services/shipper-portal.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { ToastComponent } from '../../../../shared/ui/toast/toast.component';
import { ShipperProfile } from '../../models/shipper.models';

@Component({
  selector: 'app-shipper-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, ToastComponent],
  templateUrl: './shipper-layout.component.html',
  styleUrl: './shipper-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class ShipperLayoutComponent implements OnInit {
  private readonly shipperService = inject(ShipperPortalService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly profile = signal<ShipperProfile | null>(null);
  readonly pickupCount = signal<number>(0);
  readonly deliveringCount = signal<number>(0);
  readonly codCollectedToday = signal<number>(0);
  readonly isAvailable = signal<boolean>(true);
  readonly currentDate = signal<string>('Hôm nay: Thứ năm, 22/10/2026');

  ngOnInit(): void {
    this.shipperService.getProfile().subscribe();
    this.shipperService.getShipments().subscribe();
    this.shipperService.profile$.subscribe((prof) => {
      this.profile.set(prof);
      this.isAvailable.set(prof?.workStatus === 'AVAILABLE');
    });

    this.shipperService.shipments$.subscribe((list) => {
      const pickup = list.filter((s) => s.status === 'ASSIGNED').length;
      const delivering = list.filter((s) => s.status === 'DELIVERING').length;
      const cod = list
        .filter((s) => s.status === 'DELIVERED')
        .reduce((sum, item) => sum + item.codAmount, 0);

      this.pickupCount.set(pickup);
      this.deliveringCount.set(delivering);
      this.codCollectedToday.set(cod);
    });

    this.updateClock();
  }

  private updateClock(): void {
    const now = new Date();
    const days = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
    const dayName = days[now.getDay()];
    const d = String(now.getDate()).padStart(2, '0');
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const y = now.getFullYear();
    this.currentDate.set(`Hôm nay: ${dayName}, ${d}/${m}/${y}`);
  }

  onToggleWorkStatus(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.shipperService.updateWorkStatus(checked).subscribe({
      next: (updated) => {
        this.isAvailable.set(updated.workStatus === 'AVAILABLE');
        if (checked) {
          this.toastService.success('Đã BẬT trạng thái: Sẵn sàng nhận đơn từ hệ thống!');
        } else {
          this.toastService.info('Đã TẮT nhận đơn: Hệ thống sẽ tạm dừng phân bổ đơn mới.');
        }
      },
      error: () => {
        this.toastService.error('Không thể cập nhật trạng thái nhận ca');
      },
    });
  }

  onResetData(): void {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ dữ liệu kiểm thử Shipper về ban đầu không?')) {
      this.shipperService.resetMockData().subscribe({
        next: () => {
          this.toastService.success('Dữ liệu thử nghiệm đã được làm mới thành công!');
        },
      });
    }
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
