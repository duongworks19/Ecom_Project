import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import {
  DEFAULT_CCCD_BACK,
  DEFAULT_CCCD_FRONT,
  DEFAULT_LICENSE,
  DocumentItem,
  VENDOR_DOCUMENT_CHECKS,
  VendorApplication,
  VendorApprovalService,
  VendorApprovalStatus,
} from '../../services/vendor-approval.service';

export type TabKey = 'TODO' | 'NEED_INFO' | 'APPROVED' | 'REJECTED' | 'ALL';

@Component({
  selector: 'vic-vendor-approval-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendor-approval.page.html',
  styleUrl: './vendor-approval.page.scss',
})
export class VendorApprovalPage implements OnDestroy {
  private readonly service = inject(VendorApprovalService);
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

  readonly quickSuggestions = [
    'Giấy tờ KYC bị mờ',
    'Thông tin không khớp giấy tờ',
    'Tên shop vi phạm chính sách',
    'Thiếu địa chỉ kho',
  ];

  readonly violationTypes = [
    'Bán hàng giả / hàng nhái',
    'Kinh doanh mặt hàng cấm',
    'Lừa đảo / gian lận thương mại',
    'Xâm phạm sở hữu trí tuệ',
  ];

  readonly availableDocChecks = Object.keys(VENDOR_DOCUMENT_CHECKS);

  readonly applications = signal<VendorApplication[]>([]);
  readonly filter = signal<TabKey>('TODO');
  readonly selectedId = signal<number>(1);
  readonly query = signal<string>('');
  readonly toastMessage = signal<string | null>(null);
  readonly checksMap = signal<Record<number, boolean[]>>({
    6: [false, false, true, true],
    7: [false, false, true, true],
  });

  // Modal States
  readonly showRejectModal = signal(false);
  readonly showReqModal = signal(false);
  readonly showTerminateModal = signal(false);

  rejectReason = '';
  rejectError = signal('');

  reqNote = '';
  selectedReqItems = signal<string[]>([]);
  reqError = signal('');

  selectedViolation = this.violationTypes[0];
  terminateReason = '';
  terminateError = signal('');

  private toastTimeout?: ReturnType<typeof setTimeout>;
  private readonly storageListener = () => {
    this.loadVendors();
  };

  readonly counts = computed(() => {
    const list = this.applications();
    return {
      TODO: list.filter((v) => v.status === 'PENDING').length,
      NEED_INFO: list.filter((v) => v.status === 'NEED_INFO' || v.status === 'RESUBMITTED').length,
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
      if (f === 'TODO') matchesTab = v.status === 'PENDING';
      else if (f === 'NEED_INFO') matchesTab = v.status === 'NEED_INFO' || v.status === 'RESUBMITTED';
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

    window.addEventListener('storage', this.storageListener);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.searchChanges.complete();
    window.removeEventListener('storage', this.storageListener);
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
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
    this.service.syncUserOnboardingDraft();
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
    return (
      v.status === 'PENDING' ||
      v.status === 'RESUBMITTED' ||
      (v.status === 'NEED_INFO' && ((v.fresh?.length || 0) > 0 || (v.docItems || []).some((d) => d.isNew)))
    );
  }

  redoIndices(v: VendorApplication): Set<number> {
    const set = new Set<number>();
    if (!v.req) return set;
    for (const r of v.req) {
      const indices: number[] = VENDOR_DOCUMENT_CHECKS[r] || [];
      indices.forEach((i: number) => set.add(i));
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

  // --- REJECT MODAL ---
  openRejectDialog(): void {
    this.rejectReason = '';
    this.rejectError.set('');
    this.showRejectModal.set(true);
  }

  addRejectSuggestion(suggestion: string): void {
    const cur = this.rejectReason.trim();
    this.rejectReason = cur ? `${cur} ${suggestion}.` : `${suggestion}.`;
    this.rejectError.set('');
  }

  confirmReject(): void {
    const reason = this.rejectReason.trim();
    if (reason.length < 10) {
      this.rejectError.set('Nhập lý do từ chối ít nhất 10 ký tự để vendor biết cần sửa gì.');
      return;
    }
    const vendor = this.selectedVendor();
    if (!vendor) return;

    this.service
      .rejectVendor(vendor.id, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.showRejectModal.set(false);
        this.showToast(`Đã từ chối ${updated.shop}. Lý do đã gửi cho vendor.`);
      });
  }

  // --- REQUEST INFO MODAL ---
  openRequestInfoDialog(): void {
    this.reqNote = '';
    this.selectedReqItems.set([]);
    this.reqError.set('');
    this.showReqModal.set(true);
  }

  toggleReqItem(item: string): void {
    this.selectedReqItems.update((items) =>
      items.includes(item) ? items.filter((i) => i !== item) : [...items, item]
    );
    this.reqError.set('');
  }

  isReqItemSelected(item: string): boolean {
    return this.selectedReqItems().includes(item);
  }

  confirmReq(): void {
    const items = this.selectedReqItems();
    const note = this.reqNote.trim();
    if (!items.length || note.length < 10) {
      this.reqError.set('Chọn ít nhất một mục cần bổ sung và nhập hướng dẫn tối thiểu 10 ký tự.');
      return;
    }
    const vendor = this.selectedVendor();
    if (!vendor) return;

    this.service
      .requestAdditionalInfo(vendor.id, items, note)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
          this.showReqModal.set(false);
          this.filter.set('NEED_INFO');
          this.selectedId.set(updated.id);
          this.showToast(`Đã gửi yêu cầu bổ sung cho ${updated.shop}. Hồ sơ chuyển sang Chờ vendor bổ sung.`);
        },
        error: (err) => {
          const msg = err?.error?.message || err?.message || 'Có lỗi khi gửi yêu cầu bổ sung. Vui lòng thử lại.';
          this.reqError.set(msg);
        },
      });
  }

  // --- TERMINATE MODAL ---
  openTerminateDialog(): void {
    this.terminateReason = '';
    this.terminateError.set('');
    this.selectedViolation = this.violationTypes[0];
    this.showTerminateModal.set(true);
  }

  confirmTerminate(): void {
    const reason = this.terminateReason.trim();
    if (reason.length < 10) {
      this.terminateError.set('Vui lòng nhập chi tiết vi phạm tối thiểu 10 ký tự.');
      return;
    }
    const vendor = this.selectedVendor();
    if (!vendor) return;

    this.service
      .terminateVendorAccount(vendor.id, this.selectedViolation, reason)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.showTerminateModal.set(false);
        this.filter.set('REJECTED');
        this.selectedId.set(updated.id);
        this.showToast(`Đã xóa tài khoản shop ${updated.shop} do vi phạm quy định cấm.`);
      });
  }

  closeModals(): void {
    this.showRejectModal.set(false);
    this.showReqModal.set(false);
    this.showTerminateModal.set(false);
  }

  simulateResubmit(): void {
    const vendor = this.selectedVendor();
    if (!vendor) return;

    this.service
      .simulateVendorResubmission(vendor.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((updated) => {
        const redo = this.redoIndices(updated);
        this.checksMap.update((map) => {
          const current = map[updated.id] ? [...map[updated.id]] : [false, false, false, false];
          redo.forEach((i) => (current[i] = false));
          return { ...map, [updated.id]: current };
        });

        this.applications.update((list) => list.map((v) => (v.id === updated.id ? updated : v)));
        this.filter.set('NEED_INFO');
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
    return name ? name.trim().charAt(0).toUpperCase() : 'V';
  }

  // --- IMAGE PREVIEW LIGHTBOX ---
  readonly previewDocModal = signal<boolean>(false);
  readonly previewDocUrl = signal<string>('');
  readonly previewDocTitle = signal<string>('');

  openPreviewModal(url: string, title: string): void {
    if (!url) return;
    this.previewDocUrl.set(url);
    this.previewDocTitle.set(title);
    this.previewDocModal.set(true);
  }

  closePreviewModal(): void {
    this.previewDocModal.set(false);
  }

  hasDoc(v: VendorApplication, name: string): boolean {
    return (v.docItems || []).some((d) => d.name === name && !!d.url);
  }

  onDocImgError(event: Event, d: DocumentItem): void {
    d.url = undefined;
  }
}
