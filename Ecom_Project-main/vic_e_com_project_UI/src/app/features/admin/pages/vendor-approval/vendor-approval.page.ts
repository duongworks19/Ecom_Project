import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { RejectDialogComponent } from './reject-dialog.component';
import { RequestInfoDialogComponent } from './request-info-dialog.component';
import { TerminateAccountDialogComponent, TerminateResult } from './terminate-account-dialog.component';
import {
  HistoryEntry,
  VENDOR_DOCUMENT_CHECKS,
  VendorApplication,
  VendorApprovalService,
  VendorApprovalStatus,
} from '../../services/vendor-approval.service';

export type TabKey = 'TODO' | 'NEED_INFO' | 'APPROVED' | 'REJECTED' | 'ALL';

@Component({
  selector: 'vic-vendor-approval-page',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule],
  templateUrl: './vendor-approval.page.html',
  styleUrl: './vendor-approval.page.scss',
})
export class VendorApprovalPage implements OnDestroy {
  private readonly service = inject(VendorApprovalService);
  private readonly dialog = inject(MatDialog);
  private readonly searchChanges = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  readonly tabs: { key: TabKey; label: string }[] = [
    { key: 'TODO', label: 'Cần xử lý' },
    { key: 'NEED_INFO', label: 'Chờ vendor bổ sung' },
    { key: 'APPROVED', label: 'Đã duyệt' },
    { key: 'REJECTED', label: 'Đã từ chối' },
    { key: 'ALL', label: 'Tất cả' },
  ];

  readonly checkLabels = [
    'Họ tên khớp với giấy tờ KYC',
    'Giấy tờ rõ nét, còn hiệu lực',
    'Tên gian hàng không vi phạm chính sách',
    'Địa chỉ kho lấy hàng hợp lệ',
  ];

  readonly applications = signal<VendorApplication[]>([]);
  readonly filter = signal<TabKey>('TODO');
  readonly selectedId = signal<number>(1);
  readonly query = signal<string>('');
  readonly toastMessage = signal<string | null>(null);
  readonly checksMap = signal<Record<number, boolean[]>>({
    6: [false, false, true, true],
    7: [false, false, true, true],
  });

  private toastTimeout?: ReturnType<typeof setTimeout>;

  readonly counts = computed(() => {
    const list = this.applications();
    return {
      TODO: list.filter((v) => v.status === 'PENDING' || v.status === 'RESUBMITTED').length,
      NEED_INFO: list.filter((v) => v.status === 'NEED_INFO').length,
      APPROVED: list.filter((v) => v.status === 'APPROVED').length,
      REJECTED: list.filter((v) => v.status === 'REJECTED').length,
      ALL: list.length,
    };
  });

  readonly visibleVendors = computed(() => {
    const list = this.applications();
    const f = this.filter();
    const q = this.query().trim().toLowerCase();
    const cleanQ = q.replace(/\s+/g, '');

    return list.filter((v) => {
      let matchesTab = true;
      if (f === 'TODO') matchesTab = v.status === 'PENDING' || v.status === 'RESUBMITTED';
      else if (f !== 'ALL') matchesTab = v.status === f;

      if (!matchesTab) return false;
      if (!q) return true;

      const searchable = (v.shop + v.owner + v.email).toLowerCase();
      const phoneClean = v.phone.replace(/\s+/g, '');
      return searchable.includes(q) || phoneClean.includes(cleanQ);
    });
  });

  readonly selectedVendor = computed(() => {
    const list = this.visibleVendors();
    const id = this.selectedId();
    return list.find((v) => v.id === id) || (list.length > 0 ? list[0] : null);
  });

  readonly currentChecks = computed(() => {
    const v = this.selectedVendor();
    if (!v) return [false, false, false, false];
    const map = this.checksMap();
    return map[v.id] || [false, false, false, false];
  });

  readonly allChecked = computed(() => {
    return this.currentChecks().every(Boolean);
  });

  constructor() {
    this.searchChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((val) => this.query.set(val));
    this.loadVendors();

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', this.onStorageChange);
      window.addEventListener('vic-vendor-applications-changed', this.onStorageChange);
    }
  }

  private readonly onStorageChange = (): void => {
    this.loadVendors();
  };

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchChanges.complete();
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.onStorageChange);
      window.removeEventListener('vic-vendor-applications-changed', this.onStorageChange);
    }
  }

  loadVendors(): void {
    this.service
      .getVendors()
      .pipe(takeUntil(this.destroy$))
      .subscribe((list) => {
        this.applications.set(list);
        if (list.length > 0 && !list.some((v) => v.id === this.selectedId())) {
          this.selectedId.set(list[0].id);
        }
      });
  }

  setFilter(key: TabKey): void {
    this.filter.set(key);
    const visible = this.visibleVendors();
    if (visible.length > 0 && !visible.some((v) => v.id === this.selectedId())) {
      this.selectedId.set(visible[0].id);
    }
  }

  selectVendor(id: number): void {
    this.selectedId.set(id);
  }

  onSearch(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchChanges.next(input.value);
  }

  toggleCheck(index: number, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const vendor = this.selectedVendor();
    if (!vendor) return;

    this.checksMap.update((map) => {
      const current = map[vendor.id] ? [...map[vendor.id]] : [false, false, false, false];
      current[index] = checked;
      return { ...map, [vendor.id]: current };
    });
  }

  isOpen(v: VendorApplication): boolean {
    return v.status === 'PENDING' || v.status === 'RESUBMITTED';
  }

  redoIndices(v: VendorApplication): Set<number> {
    const set = new Set<number>();
    if (!v.req) return set;
    for (const r of v.req) {
      const indices = VENDOR_DOCUMENT_CHECKS[r] || [];
      indices.forEach((i) => set.add(i));
    }
    return set;
  }

  keptCount(v: VendorApplication): number {
    const checks = this.checksMap()[v.id] || [false, false, false, false];
    const redo = this.redoIndices(v);
    return checks.filter((checked, i) => checked && !redo.has(i)).length;
  }

  approve(): void {
    const vendor = this.selectedVendor();
    if (!vendor || !this.allChecked()) return;

    this.service
      .approveVendor(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.showToast(`Đã duyệt ${updated.shop}. Gian hàng đã được kích hoạt.`);
      });
  }

  openRejectDialog(): void {
    const vendor = this.selectedVendor();
    if (!vendor) return;

    const ref = this.dialog.open(RejectDialogComponent, {
      width: '480px',
      maxWidth: '100%',
      data: { shop: vendor.shop },
      panelClass: 'custom-dialog-panel',
    });

    ref.afterClosed().subscribe((reason?: string) => {
      if (!reason) return;
      this.service
        .rejectVendor(vendor.id, reason)
        .pipe(takeUntil(this.destroy$))
        .subscribe((updated) => {
          this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
          this.showToast(`Đã từ chối ${updated.shop}. Lý do đã gửi cho vendor.`);
        });
    });
  }

  openRequestInfoDialog(): void {
    const vendor = this.selectedVendor();
    if (!vendor) return;

    const ref = this.dialog.open(RequestInfoDialogComponent, {
      width: '480px',
      maxWidth: '100%',
      data: { id: vendor.id, shop: vendor.shop },
      panelClass: 'custom-dialog-panel',
    });

    ref.afterClosed().subscribe((res?: { application?: VendorApplication; status?: number }) => {
      if (!res?.application) return;
      const updated = res.application;
      this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
      this.filter.set('NEED_INFO');
      this.selectedId.set(updated.id);
      this.showToast(`Đã gửi yêu cầu bổ sung cho ${updated.shop}. Hồ sơ chuyển sang Chờ vendor bổ sung.`);
    });
  }

  openTerminateDialog(): void {
    const vendor = this.selectedVendor();
    if (!vendor) return;

    const ref = this.dialog.open(TerminateAccountDialogComponent, {
      width: '520px',
      maxWidth: '100%',
      data: { id: vendor.id, shop: vendor.shop, owner: vendor.owner },
      panelClass: 'custom-dialog-panel',
    });

    ref.afterClosed().subscribe((res?: TerminateResult) => {
      if (!res) return;
      this.service
        .terminateVendorAccount(vendor.id, res.violationType, res.reason)
        .pipe(takeUntil(this.destroy$))
        .subscribe((updated) => {
          this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
          this.filter.set('REJECTED');
          this.selectedId.set(updated.id);
          this.showToast(`Đã xóa tài khoản shop ${updated.shop} do vi phạm quy định cấm.`);
        });
    });
  }

  simulateResubmit(): void {
    const vendor = this.selectedVendor();
    if (!vendor) return;

    this.service
      .simulateVendorResubmission(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        // Reset only redo check indices
        const redo = this.redoIndices(updated);
        this.checksMap.update((map) => {
          const current = map[updated.id] ? [...map[updated.id]] : [false, false, false, false];
          redo.forEach((i) => (current[i] = false));
          return { ...map, [updated.id]: current };
        });

        this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.filter.set('TODO');
        this.selectedId.set(updated.id);
        this.showToast(`${updated.shop} đã bổ sung hồ sơ.`);
      });
  }

  showToast(message: string): void {
    this.toastMessage.set(message);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 2600);
  }

  statusLabel(status: VendorApprovalStatus): string {
    switch (status) {
      case 'PENDING':
        return 'Chờ duyệt';
      case 'RESUBMITTED':
        return 'Đã bổ sung';
      case 'NEED_INFO':
        return 'Chờ bổ sung';
      case 'APPROVED':
        return 'Đã duyệt';
      case 'REJECTED':
        return 'Đã từ chối';
      default:
        return status;
    }
  }

  statusClass(status: VendorApprovalStatus): string {
    switch (status) {
      case 'RESUBMITTED':
        return 'info';
      case 'NEED_INFO':
        return 'warn';
      case 'APPROVED':
        return 'ok';
      case 'REJECTED':
        return 'no';
      default:
        return '';
    }
  }

  initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }
}
