import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoucherItem } from '../../models/seller-dashboard.model';
import { SellerDashboardStore } from '../../services/seller-dashboard.store';
import { SellerVouchersApiService } from '../../services/seller-vouchers-api.service';
import {
  SellerVoucherModalComponent,
  SellerVoucherFormData,
} from '../../components/seller-voucher-modal/seller-voucher-modal.component';

@Component({
  selector: 'app-seller-vouchers',
  standalone: true,
  imports: [CommonModule, SellerVoucherModalComponent],
  templateUrl: './seller-vouchers.component.html',
  styleUrl: './seller-vouchers.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerVouchersComponent implements OnInit {
  readonly store = inject(SellerDashboardStore);
  private readonly vouchersApi = inject(SellerVouchersApiService);

  readonly vouchers = this.store.vouchers;
  readonly voucherModalOpen = signal<boolean>(false);

  ngOnInit(): void {
    this.loadVouchers();
  }

  formatVnd(amount: number): string {
    return (amount || 0).toLocaleString('vi-VN') + 'đ';
  }

  loadVouchers(): void {
    this.vouchersApi.getVouchers().subscribe({
      next: (res) => {
        const raw = res?.data || res || [];
        if (Array.isArray(raw) && raw.length > 0) {
          const mapped: VoucherItem[] = raw.map((item: any) => ({
            id: item.id,
            code: item.code,
            t: item.discountType || item.t || 'PERCENT',
            val: item.value != null ? Number(item.value) : (item.val || 0),
            max: item.maxDiscount != null ? Number(item.maxDiscount) : (item.max || 0),
            min: item.minOrderAmount != null ? Number(item.minOrderAmount) : (item.min || 0),
            lim: item.usageLimit || item.lim || 100,
            used: item.usedCount || item.used || 0,
            from: item.startAt ? item.startAt.split('T')[0] : (item.from || ''),
            to: item.endAt ? item.endAt.split('T')[0] : (item.to || ''),
            st: (item.status || item.st || 'ACTIVE') as any,
          }));
          this.vouchers.set(mapped);
        }
      },
      error: () => {},
    });
  }

  openCreateVoucherModal(): void {
    this.voucherModalOpen.set(true);
  }

  closeVoucherModal(): void {
    this.voucherModalOpen.set(false);
  }

  handleSaveVoucher(v: SellerVoucherFormData): void {
    const payload = {
      code: v.code,
      discountType: v.t || 'PERCENT',
      value: v.val,
      maxDiscount: v.t === 'PERCENT' ? (v.max && Number(v.max) > 0 ? Number(v.max) : null) : null,
      minOrderAmount: v.min ? Number(v.min) : 0,
      usageLimit: v.lim ? Number(v.lim) : 100,
      startAt: v.from ? (v.from.includes('T') ? v.from.split('.')[0] : `${v.from}T00:00:00`) : null,
      endAt: v.to ? (v.to.includes('T') ? v.to.split('.')[0] : `${v.to}T23:59:59`) : null,
    };

    this.vouchersApi.createVoucher(payload).subscribe({
      next: (res) => {
        const saved = res?.data;
        const newVoucher: VoucherItem = {
          id: saved?.id,
          code: saved?.code || v.code,
          t: (saved?.discountType || v.t || 'PERCENT') as 'PERCENT' | 'FIXED',
          val: saved?.value != null ? Number(saved.value) : (v.val ?? 0),
          max: saved?.maxDiscount != null ? Number(saved.maxDiscount) : (v.max ?? 0),
          min: saved?.minOrderAmount != null ? Number(saved.minOrderAmount) : (v.min ?? 0),
          lim: saved?.usageLimit || v.lim || 100,
          used: saved?.usedCount || 0,
          from: saved?.startAt ? saved.startAt.split('T')[0] : (v.from || ''),
          to: saved?.endAt ? saved.endAt.split('T')[0] : (v.to || ''),
          st: (saved?.status || 'ACTIVE') as any,
        };
        this.vouchers.update((list) => [newVoucher, ...list.filter((item) => item.code !== newVoucher.code)]);
        this.store.showToast(`🎉 Đã tạo mã voucher ${v.code}.`);
        this.closeVoucherModal();
      },
      error: () => {
        const fallbackVoucher: VoucherItem = {
          code: v.code,
          t: v.t || 'PERCENT',
          val: v.val || 0,
          max: v.max || 0,
          min: v.min || 0,
          lim: v.lim || 100,
          used: 0,
          from: v.from || '',
          to: v.to || '',
          st: 'ACTIVE',
        };
        this.vouchers.update((list) => [fallbackVoucher, ...list]);
        this.store.showToast(`🎉 Đã tạo mã voucher ${v.code} (offline).`);
        this.closeVoucherModal();
      },
    });
  }

  toggleVoucher(code: string): void {
    const target = this.vouchers().find((v) => v.code === code);
    if (!target) return;
    const newStatus = target.st === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
    if (target.id) {
      this.vouchersApi.updateVoucherStatus(target.id, newStatus).subscribe({
        next: () => {
          this.vouchers.update((list) =>
            list.map((v) => (v.code === code ? { ...v, st: newStatus } : v))
          );
          if (newStatus === 'PAUSED') {
            this.store.showToast(`⏸️ Đã tạm dừng voucher ${code} (mã đã được ẩn khỏi gian hàng khách).`);
          } else {
            this.store.showToast(`▶️ Đã kích hoạt lại voucher ${code} (mã đang hiển thị cho khách).`);
          }
        },
        error: (err) => {
          this.store.showToast(err?.error?.message || 'Không thể cập nhật trạng thái voucher.');
        },
      });
    } else {
      this.vouchers.update((list) =>
        list.map((v) => (v.code === code ? { ...v, st: newStatus } : v))
      );
      if (newStatus === 'PAUSED') {
        this.store.showToast(`⏸️ Đã tạm dừng voucher ${code}.`);
      } else {
        this.store.showToast(`▶️ Đã kích hoạt lại voucher ${code}.`);
      }
    }
  }

  deleteVoucher(code: string): void {
    if (!confirm(`Bạn có chắc muốn xóa vĩnh viễn voucher "${code}"?`)) return;
    const target = this.vouchers().find((v) => v.code === code);
    if (target && target.id) {
      this.vouchersApi.deleteVoucher(target.id).subscribe({
        next: () => {
          this.vouchers.update((list) => list.filter((v) => v.code !== code));
          this.store.showToast(`🗑️ Đã xóa voucher ${code} thành công.`);
        },
        error: (err) => {
          this.store.showToast(err?.error?.message || 'Không thể xóa voucher.');
        },
      });
    } else {
      this.vouchers.update((list) => list.filter((v) => v.code !== code));
      this.store.showToast(`🗑️ Đã xóa voucher ${code} thành công.`);
    }
  }
}
