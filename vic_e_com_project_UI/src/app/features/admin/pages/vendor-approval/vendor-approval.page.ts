import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { RejectDialogComponent } from './reject-dialog.component';
import { VendorApplication, VendorApprovalService, VendorApprovalStatus } from '../../services/vendor-approval.service';

type FilterStatus = VendorApprovalStatus | 'ALL';

@Component({
  selector: 'vic-vendor-approval-page',
  standalone: true,
  imports: [MatButtonModule, MatCheckboxModule, MatChipsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSnackBarModule],
  templateUrl: './vendor-approval.page.html',
  styleUrl: './vendor-approval.page.scss',
})
export class VendorApprovalPage implements OnDestroy {
  private readonly service = inject(VendorApprovalService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly searchChanges = new Subject<string>();
  private readonly destroy$ = new Subject<void>();
  private countsInitialized = false;

  readonly applications = signal<VendorApplication[]>([]);
  readonly selectedVendor = signal<VendorApplication | null>(null);
  readonly filter = signal<FilterStatus>('PENDING');
  readonly search = signal('');
  readonly checks = signal([false, false, false, false]);
  readonly loading = signal(true);
  readonly pageError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly canApprove = computed(() => this.selectedVendor()?.approvalStatus === 'PENDING' && this.checks().every(Boolean) && !this.submitting());
  readonly reviewCount = computed(() => this.checks().filter((checked) => checked).length);
  readonly allChecksComplete = computed(() => this.reviewCount() === this.checkLabels.length);
  readonly visibleApplications = computed(() => this.applications().filter((item) => this.filter() === 'ALL' || item.approvalStatus === this.filter()));
  readonly counts = signal({ PENDING: 0, APPROVED: 0, REJECTED: 0, ALL: 0 });
  readonly checkLabels = [
    'Họ tên khớp với giấy tờ KYC',
    'Giấy tờ rõ nét và còn hiệu lực',
    'Tên shop không vi phạm quy định',
    'Địa chỉ kho lấy hàng hợp lệ',
  ];

  constructor() {
    this.searchChanges.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe((query) => this.loadApplications(query));
    this.loadApplications('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchChanges.complete();
  }

  setSearch(value: string): void {
    this.search.set(value);
    this.searchChanges.next(value);
  }

  setFilter(filter: FilterStatus): void {
    this.filter.set(filter);
    const available = this.visibleApplications();
    const current = this.selectedVendor();
    if (!available.length) {
      this.selectedVendor.set(null);
      this.checks.set([false, false, false, false]);
    } else if (!available.some((item) => item.id === current?.id)) {
      this.selectVendor(available[0]);
    }
  }

  selectVendor(vendor: VendorApplication): void {
    this.selectedVendor.set(vendor);
    this.checks.set([false, false, false, false]);
    this.actionError.set(null);
    this.service.getVendor(vendor.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (detail) => {
        this.selectedVendor.set(detail);
      },
      error: (error: unknown) => {
        this.handleError(error, true);
      },
    });
  }

  toggleCheck(index: number, checked: boolean): void {
    this.checks.update((checks) => checks.map((value, i) => (i === index ? checked : value)));
  }

  approve(): void {
    const vendor = this.selectedVendor();
    if (!vendor || !this.canApprove()) return;
    this.submitting.set(true);
    this.actionError.set(null);
    this.service.approveVendor(vendor.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.updateVendor(updated);
        this.submitting.set(false);
        this.snackBar.open(`Đã duyệt ${updated.businessName}. Gian hàng đã được kích hoạt.`, 'Đóng', { duration: 4500 });
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.handleError(error, true);
      },
    });
  }

  openRejectDialog(): void {
    const vendor = this.selectedVendor();
    if (!vendor || vendor.approvalStatus !== 'PENDING' || this.submitting()) return;
    this.dialog.open(RejectDialogComponent, {
      width: 'min(480px, calc(100vw - 32px))',
      maxWidth: '100vw',
      autoFocus: 'textarea',
      restoreFocus: true,
      data: { businessName: vendor.businessName },
      panelClass: 'vendor-reject-dialog',
      backdropClass: 'vendor-dialog-backdrop',
    }).afterClosed().pipe(takeUntil(this.destroy$)).subscribe((reason?: string) => {
      if (reason) this.reject(vendor, reason);
    });
  }

  private reject(vendor: VendorApplication, reason: string): void {
    this.submitting.set(true);
    this.actionError.set(null);
    this.service.rejectVendor(vendor.id, reason).pipe(takeUntil(this.destroy$)).subscribe({
      next: (updated) => {
        this.updateVendor(updated);
        this.submitting.set(false);
        this.snackBar.open(`Đã từ chối ${updated.businessName}. Lý do đã gửi cho vendor.`, 'Đóng', { duration: 4500 });
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.handleError(error, true, true);
      },
    });
  }

  retry(): void {
    this.loadApplications(this.search());
  }

  statusLabel(status: VendorApprovalStatus): string {
    return status === 'PENDING' ? 'Chờ duyệt' : status === 'APPROVED' ? 'Đã duyệt' : 'Đã từ chối';
  }

  formatDate(value?: string): string {
    if (!value) return '—';
    const parts = new Intl.DateTimeFormat('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(value));
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? '';
    return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
  }

  formatDateOnly(value: string): string {
    return this.formatDate(value).slice(0, 10);
  }

  private loadApplications(query: string): void {
    this.loading.set(true);
    this.pageError.set(null);
    this.service.getVendors({ status: 'ALL', q: query }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (items) => {
        this.applications.set(items);
        if (!this.countsInitialized || !query) {
          this.counts.set({
            PENDING: items.filter((item) => item.approvalStatus === 'PENDING').length,
            APPROVED: items.filter((item) => item.approvalStatus === 'APPROVED').length,
            REJECTED: items.filter((item) => item.approvalStatus === 'REJECTED').length,
            ALL: items.length,
          });
          this.countsInitialized = true;
        }
        this.loading.set(false);
        const available = items.filter((item) => this.filter() === 'ALL' || item.approvalStatus === this.filter());
        const selected = available.find((item) => item.id === this.selectedVendor()?.id) ?? available[0] ?? null;
        if (!selected) {
          this.selectedVendor.set(null);
          this.checks.set([false, false, false, false]);
        } else if (selected.id !== this.selectedVendor()?.id) {
          this.selectVendor(selected);
        } else {
          this.selectedVendor.set(selected);
        }
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.pageError.set(this.errorMessage(error));
      },
    });
  }

  private updateVendor(updated: VendorApplication): void {
    const current = this.applications().find((item) => item.id === updated.id) ?? this.selectedVendor();
    if (current && current.approvalStatus !== updated.approvalStatus) {
      this.counts.update((counts) => ({
        ...counts,
        [current.approvalStatus]: counts[current.approvalStatus] - 1,
        [updated.approvalStatus]: counts[updated.approvalStatus] + 1,
      }));
    }
    this.applications.update((items) => items.map((item) => item.id === updated.id ? updated : item));
    this.selectedVendor.set(updated);
  }

  private handleError(error: unknown, refreshList: boolean, rejecting = false): void {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 401) return; // The existing auth interceptor owns expired-session handling.
    if (status === 404 || status === 409) {
      this.actionError.set(status === 404 ? 'Hồ sơ không còn tồn tại.' : 'Hồ sơ đã được xử lý.');
      if (refreshList) this.loadApplications(this.search());
      return;
    }
    if (status === 403) this.actionError.set('Bạn không có quyền thực hiện thao tác này.');
    else if (status === 400 || status === 422) {
      this.actionError.set(rejecting ? 'Lý do từ chối cần có từ 10 đến 500 ký tự.' : 'Thông tin gửi lên không hợp lệ. Vui lòng kiểm tra lại.');
    }
    else this.actionError.set('Không thể hoàn tất thao tác. Vui lòng thử lại sau.');
  }

  private errorMessage(error: unknown): string {
    const status = error instanceof HttpErrorResponse ? error.status : 0;
    if (status === 401) return '';
    if (status === 403) return 'Bạn không có quyền xem danh sách vendor.';
    if (status >= 500) return 'Hệ thống đang gặp sự cố. Vui lòng thử lại.';
    return 'Không thể tải danh sách hồ sơ. Vui lòng thử lại.';
  }
}
