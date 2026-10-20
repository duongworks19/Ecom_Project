import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminVoucherItem, AdminVoucherResponse, AdminVouchersService } from '../../services/admin-vouchers.service';

@Component({
  selector: 'vic-admin-vouchers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-vouchers.component.html',
  styleUrl: './admin-vouchers.component.scss',
})
export class AdminVouchersComponent implements OnInit {
  private voucherService = inject(AdminVouchersService);

  readonly vouchers = signal<AdminVoucherItem[]>([]);
  readonly response = signal<AdminVoucherResponse>({
    items: [],
    total: 0,
    page: 0,
    size: 10,
    totalPages: 0,
    summaryTotal: 0,
    summaryActive: 0,
  });

  readonly isLoading = signal<boolean>(true);
  readonly toastMessage = signal<string | null>(null);

  keyword = '';
  selectedStatus = 'ALL';
  page = 0;
  size = 10;

  // Create Modal
  showModal = false;
  code = '';
  title = '';
  discountText = '20.000đ';
  minOrderAmount = 100000;
  totalQuota = 50;
  expiryDate = '31/12/2026';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.voucherService.getVouchers(this.keyword, this.selectedStatus, this.page, this.size).subscribe({
      next: (res) => {
        this.response.set(res.data);
        this.vouchers.set(res.data.items);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onSearch(): void {
    this.page = 0;
    this.loadData();
  }

  onFilterStatus(st: string): void {
    this.selectedStatus = st;
    this.page = 0;
    this.loadData();
  }

  openCreateModal(): void {
    this.code = 'VIC' + Math.floor(1000 + Math.random() * 9000);
    this.title = 'Ưu đãi tri ân khách hàng VIC MART';
    this.discountText = '30.000đ';
    this.minOrderAmount = 150000;
    this.totalQuota = 100;
    this.expiryDate = '31/12/2026';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveVoucher(): void {
    if (!this.code.trim()) {
      alert('Vui lòng nhập mã Voucher');
      return;
    }
    this.voucherService
      .createVoucher({
        code: this.code.trim().toUpperCase(),
        title: this.title.trim(),
        discountText: this.discountText.trim(),
        minOrderAmount: Number(this.minOrderAmount) || 100000,
        totalQuota: Number(this.totalQuota) || 50,
        expiryDate: this.expiryDate,
      })
      .subscribe({
        next: () => {
          this.closeModal();
          this.showToast(`Đã tạo mã giảm giá ${this.code} thành công`);
          this.loadData();
        },
        error: (err) => alert(err.error?.message || 'Lỗi khi tạo voucher'),
      });
  }

  toggleVoucher(v: AdminVoucherItem): void {
    this.voucherService.toggleVoucher(v.id).subscribe({
      next: (res) => {
        v.active = res.data.active;
        this.showToast(`Đã cập nhật trạng thái Voucher ${v.code}`);
      },
    });
  }

  deleteVoucher(v: AdminVoucherItem): void {
    if (!confirm(`Bạn có chắc muốn xóa Voucher "${v.code}"?`)) return;
    this.voucherService.deleteVoucher(v.id).subscribe({
      next: () => {
        this.showToast(`Đã xóa Voucher ${v.code}`);
        this.loadData();
      },
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3500);
  }
}
