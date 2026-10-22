import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, mergeMap, of, throwError, timer } from 'rxjs';

export type VendorApprovalStatus = 'PENDING' | 'NEED_INFO' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';

export interface HistoryEntry {
  t: string;
  x: string;
}

export interface VendorApplication {
  id: number;
  shop: string;
  owner: string;
  email: string;
  phone: string;
  model: string;
  cat: string;
  desc?: string;
  pickup: string;
  tax?: string;
  at: string;
  status: VendorApprovalStatus;
  docs: string[];
  req?: string[];
  fresh?: string[];
  rnote?: string;
  due?: string;
  reason?: string;
  by?: string;
  dat?: string;
  h?: HistoryEntry[];
}

export const VENDOR_DOCUMENT_CHECKS: Record<string, number[]> = {
  'CCCD mặt trước': [0, 1],
  'CCCD mặt sau': [0, 1],
  'Giấy phép kinh doanh': [1],
  'Mã số thuế': [1],
  'Tên gian hàng': [2],
  'Địa chỉ kho': [3],
};

export const VENDOR_APPLICATIONS_STORAGE_KEY = 'vic_vendor_applications_list';
const DRAFT_STORAGE_KEY = 'vic_seller_onboarding_draft';

const INITIAL_APPLICATIONS: VendorApplication[] = [
  {
    id: 1,
    shop: 'Lumi Home Decor',
    owner: 'Nguyễn Thị Lan',
    email: 'lan.lumi@gmail.com',
    phone: '0912 345 678',
    model: 'Hộ kinh doanh',
    cat: 'Nhà cửa & Đời sống',
    desc: 'Đồ decor và đèn trang trí phong cách tối giản Bắc Âu, ship toàn quốc.',
    pickup: 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
    tax: '0109876543',
    at: '14/10/2026 09:12',
    status: 'PENDING',
    docs: ['CCCD mặt trước', 'CCCD mặt sau', 'Giấy phép kinh doanh'],
    h: [{ t: '14/10/2026 09:12', x: 'Vendor gửi hồ sơ' }],
  },
  {
    id: 2,
    shop: 'VC (4)',
    owner: 'Trần Minh Quân',
    email: 'quan.vc@gmail.com',
    phone: '0987 111 222',
    model: 'Cá nhân',
    cat: 'Thể thao & Dã ngoại',
    desc: '',
    pickup: '45 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
    tax: '—',
    at: '14/10/2026 08:40',
    status: 'PENDING',
    docs: ['CCCD mặt trước', 'CCCD mặt sau'],
    h: [{ t: '14/10/2026 08:40', x: 'Vendor gửi hồ sơ' }],
  },
  {
    id: 3,
    shop: 'Mộc Mơ Kitchen',
    owner: 'Phạm Thu Hà',
    email: 'ha.mocmo@gmail.com',
    phone: '0903 456 789',
    model: 'Doanh nghiệp',
    cat: 'Thực phẩm & Đồ uống',
    desc: 'Mứt, trà và bánh thủ công làm từ nguyên liệu địa phương.',
    pickup: 'Lô 5 KCN Quang Minh, Mê Linh, Hà Nội',
    tax: '0108123456',
    at: '13/10/2026 16:25',
    status: 'PENDING',
    docs: ['CCCD người đại diện', 'Giấy ĐKKD', 'Giấy ATTP'],
    h: [{ t: '13/10/2026 16:25', x: 'Vendor gửi hồ sơ' }],
  },
  {
    id: 4,
    shop: 'Pixel Gear VN',
    owner: 'Lê Hoàng Nam',
    email: 'nam.pixel@gmail.com',
    phone: '0966 777 888',
    model: 'Hộ kinh doanh',
    cat: 'Điện thoại & Đồ công nghệ',
    desc: 'Phụ kiện điện thoại và gaming gear chính hãng.',
    pickup: 'Số 3 Duy Tân, Cầu Giấy, Hà Nội',
    tax: '0107654321',
    at: '12/10/2026 11:03',
    status: 'APPROVED',
    docs: ['CCCD mặt trước', 'CCCD mặt sau', 'Giấy phép kinh doanh'],
    by: 'namnguyen20012005@gmail.com',
    dat: '12/10/2026 14:30',
    h: [
      { t: '12/10/2026 11:03', x: 'Vendor gửi hồ sơ' },
      { t: '12/10/2026 14:30', x: 'Admin duyệt hồ sơ' },
    ],
  },
  {
    id: 5,
    shop: 'Bé Yêu Store',
    owner: 'Võ Thanh Mai',
    email: 'mai.beyeu@gmail.com',
    phone: '0933 222 111',
    model: 'Cá nhân',
    cat: 'Mẹ & Bé',
    desc: 'Quần áo sơ sinh cotton hữu cơ.',
    pickup: '18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    tax: '—',
    at: '11/10/2026 19:45',
    status: 'REJECTED',
    docs: ['CCCD mặt trước'],
    reason: 'CCCD mặt sau bị thiếu và ảnh mặt trước bị mờ. Vui lòng tải lại đủ hai mặt.',
    dat: '12/10/2026 09:05',
    h: [
      { t: '11/10/2026 19:45', x: 'Vendor gửi hồ sơ' },
      { t: '12/10/2026 09:05', x: 'Admin từ chối: CCCD mặt sau bị thiếu và ảnh mặt trước bị mờ. Vui lòng tải lại đủ hai mặt.' },
    ],
  },
  {
    id: 6,
    shop: 'Hương Trà Shop',
    owner: 'Đỗ Thị Hương',
    email: 'huong.tra@gmail.com',
    phone: '0944 555 666',
    model: 'Cá nhân',
    cat: 'Thực phẩm & Đồ uống',
    desc: 'Trà thảo mộc đóng gói thủ công.',
    pickup: '27 Lạc Long Quân, Tây Hồ, Hà Nội',
    tax: '—',
    at: '13/10/2026 10:20',
    status: 'NEED_INFO',
    docs: ['CCCD mặt trước'],
    req: ['CCCD mặt sau', 'Giấy phép kinh doanh'],
    rnote: 'Thiếu CCCD mặt sau, vui lòng bổ sung kèm giấy phép kinh doanh.',
    due: '24/10/2026',
    h: [
      { t: '13/10/2026 10:20', x: 'Vendor gửi hồ sơ' },
      { t: '14/10/2026 15:05', x: 'Admin yêu cầu bổ sung: CCCD mặt sau, Giấy phép kinh doanh' },
    ],
  },
  {
    id: 7,
    shop: 'Gốm Bát Tràng Xưa',
    owner: 'Ngô Văn Hải',
    email: 'hai.gom@gmail.com',
    phone: '0977 123 456',
    model: 'Hộ kinh doanh',
    cat: 'Nhà cửa & Đời sống',
    desc: 'Gốm thủ công Bát Tràng, nhận đặt làm theo yêu cầu.',
    pickup: 'Thôn 2, Bát Tràng, Gia Lâm, Hà Nội',
    tax: '0105432109',
    at: '10/10/2026 14:00',
    status: 'RESUBMITTED',
    docs: ['CCCD mặt trước', 'Giấy phép kinh doanh', 'CCCD mặt sau'],
    req: ['CCCD mặt sau'],
    fresh: ['CCCD mặt sau'],
    h: [
      { t: '10/10/2026 14:00', x: 'Vendor gửi hồ sơ' },
      { t: '11/10/2026 09:30', x: 'Admin yêu cầu bổ sung: CCCD mặt sau' },
      { t: '20/10/2026 18:42', x: 'Vendor đã bổ sung: CCCD mặt sau' },
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class VendorApprovalService {
  private readonly http = inject(HttpClient, { optional: true });
  private readonly API = 'http://localhost:9090/api/vendors';
  private applications: VendorApplication[] = [];

  constructor() {
    this.initApplications();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === VENDOR_APPLICATIONS_STORAGE_KEY || e.key === DRAFT_STORAGE_KEY) {
          this.initApplications();
        }
      });
      window.addEventListener('vic-vendor-applications-changed', () => {
        this.initApplications();
      });
    }
  }

  private initApplications(): void {
    if (typeof window === 'undefined') {
      this.applications = structuredClone(INITIAL_APPLICATIONS);
      return;
    }

    try {
      const stored = localStorage.getItem(VENDOR_APPLICATIONS_STORAGE_KEY);
      if (stored) {
        this.applications = JSON.parse(stored);
      } else {
        this.applications = structuredClone(INITIAL_APPLICATIONS);
        this.saveApplicationsToStorage();
      }

      // Kiểm tra nếu có đơn vừa nộp từ seller-onboarding draft mà chưa có trong danh sách
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (draft?.status === 'PENDING' && draft.shopInfo?.shopName) {
          const exists = this.applications.some(
            (v) => v.shop.toLowerCase() === draft.shopInfo.shopName.toLowerCase()
          );
          if (!exists) {
            const d = new Date();
            const atStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
            const newApp: VendorApplication = {
              id: draft.id || Date.now(),
              shop: draft.shopInfo.shopName,
              owner: draft.contactInfo?.representativeName || 'Chủ gian hàng',
              email: draft.contactInfo?.email || 'seller@vicmart.vn',
              phone: draft.contactInfo?.phone || '0901 234 567',
              model: draft.shopInfo.businessType === 'INDIVIDUAL' ? 'Cá nhân' : draft.shopInfo.businessType === 'HOUSEHOLD' ? 'Hộ kinh doanh' : 'Doanh nghiệp',
              cat: draft.shopInfo.primaryCategory || 'Thời trang & Phụ kiện',
              desc: draft.shopInfo.description || '',
              pickup: `${draft.contactInfo?.detailedAddress || ''}, ${draft.contactInfo?.ward || ''}, ${draft.contactInfo?.district || ''}, ${draft.contactInfo?.province || ''}`,
              tax: draft.kycInfo?.taxCode || '—',
              at: atStr,
              status: 'PENDING',
              docs: ['CCCD mặt trước', 'CCCD mặt sau', ...(draft.kycInfo?.businessLicenseUrl ? ['Giấy phép kinh doanh'] : [])],
              h: [{ t: atStr, x: 'Vendor gửi hồ sơ đăng ký gian hàng' }],
            };
            this.applications.unshift(newApp);
            this.saveApplicationsToStorage();
          }
        }
      }
    } catch (e) {
      this.applications = structuredClone(INITIAL_APPLICATIONS);
    }
  }

  private saveApplicationsToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(VENDOR_APPLICATIONS_STORAGE_KEY, JSON.stringify(this.applications));
      } catch (e) {
        console.error('Failed to save applications to storage', e);
      }
    }
  }

  private syncCustomerDraft(
    shopName: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REVISION_NEEDED' | 'SUSPENDED' | 'DRAFT',
    feedback?: string
  ): void {
    if (typeof window === 'undefined') return;
    try {
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        if (!shopName || !draft.shopInfo?.shopName || draft.shopInfo.shopName.toLowerCase() === shopName.toLowerCase()) {
          draft.status = status;
          if (feedback) draft.adminFeedback = feedback;
          draft.updatedAt = new Date().toISOString();
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
          window.dispatchEvent(new CustomEvent('vic-vendor-applications-changed'));
        }
      }
    } catch (e) {
      console.error('Failed to sync customer draft', e);
    }
  }

  getVendors(params: { status?: string; q?: string } = {}): Observable<VendorApplication[]> {
    this.initApplications();
    const q = (params.q ?? '').trim().toLocaleLowerCase('vi');
    const phoneQuery = q.replace(/\s+/g, '');

    // Thử fetch từ Backend API nếu có kết nối
    if (this.http) {
      return this.http.get<any>(this.API).pipe(
        map((res) => {
          if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
            // Hợp nhất dữ liệu từ server vào local list
            res.data.forEach((item: any) => {
              const existing = this.applications.find((v) => v.id === item.id || (item.shop?.name && v.shop === item.shop.name));
              if (existing) {
                if (item.approvalStatus) existing.status = item.approvalStatus as VendorApprovalStatus;
                if (item.rejectReason) existing.reason = item.rejectReason;
              } else {
                this.applications.unshift({
                  id: item.id,
                  shop: item.shop?.name || item.businessName,
                  owner: item.ownerName || 'Chủ gian hàng',
                  email: item.email || '',
                  phone: item.phone || '',
                  model: 'Hộ kinh doanh',
                  cat: 'Thời trang & Phụ kiện',
                  desc: item.shop?.description || '',
                  pickup: item.shop?.pickupAddress || '',
                  tax: '—',
                  at: item.createdAt ? item.createdAt.slice(0, 16).replace('T', ' ') : this.formatNow(),
                  status: (item.approvalStatus || 'PENDING') as VendorApprovalStatus,
                  docs: ['CCCD mặt trước', 'CCCD mặt sau'],
                  h: [{ t: this.formatNow(), x: 'Hồ sơ người bán từ hệ thống' }],
                });
              }
            });
            this.saveApplicationsToStorage();
          }
          return this.filterVendors(this.applications, params.status, q, phoneQuery);
        }),
        catchError(() => of(this.filterVendors(this.applications, params.status, q, phoneQuery))),
        delay(100)
      );
    }

    return of(this.filterVendors(this.applications, params.status, q, phoneQuery)).pipe(delay(100));
  }

  private filterVendors(list: VendorApplication[], status?: string, q?: string, phoneQuery?: string): VendorApplication[] {
    return list.filter((vendor) => {
      let matchesStatus = true;
      if (status && status !== 'ALL') {
        if (status === 'TODO') {
          matchesStatus = vendor.status === 'PENDING' || vendor.status === 'RESUBMITTED';
        } else {
          matchesStatus = vendor.status === status;
        }
      }
      const searchable = [vendor.shop, vendor.owner, vendor.email].join(' ').toLocaleLowerCase('vi');
      return matchesStatus && (!q || searchable.includes(q) || (phoneQuery && vendor.phone.replace(/\s+/g, '').includes(phoneQuery)));
    });
  }

  getVendor(id: number): Observable<VendorApplication> {
    this.initApplications();
    const vendor = this.applications.find((item) => item.id === id);
    return vendor ? of(structuredClone(vendor)).pipe(delay(100)) : this.fail(404, 'VENDOR_NOT_FOUND');
  }

  approveVendor(id: number): Observable<VendorApplication> {
    this.initApplications();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'PENDING' && vendor.status !== 'RESUBMITTED') return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    const now = this.formatNow();
    vendor.status = 'APPROVED';
    vendor.by = 'namnguyen20012005@gmail.com';
    vendor.dat = now;
    (vendor.h = vendor.h || []).push({ t: now, x: 'Admin duyệt hồ sơ' });
    this.saveApplicationsToStorage();

    // Đồng bộ sang trạng thái của người dùng
    this.syncCustomerDraft(vendor.shop, 'APPROVED');

    // Bắn request lên backend nếu có
    if (this.http) {
      this.http.post<any>(`${this.API}/${id}/review`, { action: 'APPROVE' }).pipe(catchError(() => of(null))).subscribe();
    }

    return of(structuredClone(vendor)).pipe(delay(100));
  }

  rejectVendor(id: number, reason: string): Observable<VendorApplication> {
    this.initApplications();
    const trimmedReason = reason.trim();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'PENDING' && vendor.status !== 'RESUBMITTED') return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    if (trimmedReason.length < 10 || trimmedReason.length > 500) return this.fail(422, 'INVALID_REJECT_REASON');
    const now = this.formatNow();
    vendor.status = 'REJECTED';
    vendor.reason = trimmedReason;
    vendor.dat = now;
    (vendor.h = vendor.h || []).push({ t: now, x: `Admin từ chối: ${trimmedReason}` });
    this.saveApplicationsToStorage();

    // Đồng bộ sang trạng thái của người dùng
    this.syncCustomerDraft(vendor.shop, 'REJECTED', trimmedReason);

    // Bắn request lên backend nếu có
    if (this.http) {
      this.http.post<any>(`${this.API}/${id}/review`, { action: 'REJECT', rejectReason: trimmedReason }).pipe(catchError(() => of(null))).subscribe();
    }

    return of(structuredClone(vendor)).pipe(delay(100));
  }

  requestAdditionalInfo(id: number, items: string[], note: string): Observable<VendorApplication> {
    this.initApplications();
    const trimmedNote = note.trim();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'PENDING' && vendor.status !== 'RESUBMITTED') return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    if (!items.length || trimmedNote.length < 10 || trimmedNote.length > 500) return this.fail(422, 'INVALID_REQUEST');
    const now = this.formatNow();
    vendor.status = 'NEED_INFO';
    vendor.req = [...items];
    vendor.rnote = trimmedNote;
    vendor.due = '28/10/2026';
    (vendor.h = vendor.h || []).push({ t: now, x: `Admin yêu cầu bổ sung: ${items.join(', ')}` });
    this.saveApplicationsToStorage();

    // Đồng bộ sang trạng thái của người dùng (REVISION_NEEDED)
    this.syncCustomerDraft(vendor.shop, 'REVISION_NEEDED', `${items.join(', ')}. ${trimmedNote}`);

    return of(structuredClone(vendor)).pipe(delay(100));
  }

  simulateVendorResubmission(id: number): Observable<VendorApplication> {
    this.initApplications();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'NEED_INFO') return this.fail(409, 'INVALID_STATE');
    const now = this.formatNow();
    if (vendor.req) {
      vendor.req.forEach((r) => {
        if (!vendor.docs.includes(r)) vendor.docs.push(r);
      });
      vendor.fresh = [...vendor.req];
    }
    vendor.status = 'RESUBMITTED';
    (vendor.h = vendor.h || []).push({ t: now, x: `Vendor đã bổ sung: ${(vendor.req || []).join(', ')}` });
    this.saveApplicationsToStorage();

    // Đồng bộ lại status PENDING cho người dùng
    this.syncCustomerDraft(vendor.shop, 'PENDING');

    return of(structuredClone(vendor)).pipe(delay(100));
  }

  terminateVendorAccount(id: number, violationType: string, reason: string): Observable<VendorApplication> {
    this.initApplications();
    const trimmedReason = reason.trim();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (trimmedReason.length < 10) return this.fail(422, 'INVALID_REASON');
    const now = this.formatNow();
    vendor.status = 'REJECTED';
    vendor.reason = `Tài khoản đã bị xóa do vi phạm quy định cấm [${violationType}]: ${trimmedReason}`;
    vendor.dat = now;
    (vendor.h = vendor.h || []).push({
      t: now,
      x: `Admin xóa vĩnh viễn tài khoản shop do vi phạm quy định cấm: [${violationType}] ${trimmedReason}`,
    });
    this.saveApplicationsToStorage();

    // Đồng bộ sang trạng thái của người dùng
    this.syncCustomerDraft(vendor.shop, 'REJECTED', `Tài khoản bị chấm dứt do vi phạm [${violationType}]: ${trimmedReason}`);

    // Bắn request lên backend nếu có
    if (this.http) {
      this.http.post<any>(`${this.API}/${id}/terminate`, { violationType, reason: trimmedReason }).pipe(catchError(() => of(null))).subscribe();
    }

    return of(structuredClone(vendor)).pipe(delay(100));
  }

  private formatNow(): string {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  private fail(status: number, code: string): Observable<never> {
    return timer(100).pipe(mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: { code } }))));
  }
}
