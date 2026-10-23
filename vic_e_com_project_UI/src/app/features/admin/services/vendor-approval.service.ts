import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of, throwError, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
  isUserSubmitted?: boolean;
}

export const VENDOR_DOCUMENT_CHECKS: Record<string, number[]> = {
  'CCCD mặt trước': [0, 1],
  'CCCD mặt sau': [0, 1],
  'Giấy phép kinh doanh': [1],
  'Mã số thuế': [1],
  'Tên gian hàng': [2],
  'Địa chỉ kho': [3],
};

const DRAFT_STORAGE_KEY = 'vic_seller_onboarding_draft';
const APPLICATIONS_STORAGE_KEY = 'vic_admin_vendor_applications_v2';

const SEED_APPLICATIONS: VendorApplication[] = [
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
  private readonly apiUrl = `${environment.apiUrl}/admin/vendors`;
  private applications: VendorApplication[] = [];

  constructor() {
    this.initData();
  }

  private initData(): void {
    const saved = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (saved) {
      try {
        this.applications = JSON.parse(saved);
      } catch {
        this.applications = structuredClone(SEED_APPLICATIONS);
      }
    } else {
      this.applications = structuredClone(SEED_APPLICATIONS);
    }
    this.syncUserOnboardingDraft();
  }

  /**
   * Đồng bộ tự động với hồ sơ đăng ký shop từ trang seller-onboarding của người dùng
   */
  syncUserOnboardingDraft(): void {
    if (this.http) return;
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      const shopName = draft.shopInfo?.shopName?.trim();
      if (!shopName || draft.status === 'NOT_STARTED' || draft.status === 'DRAFT') {
        return;
      }

      // Kiểm tra xem đơn của người dùng đã có trong danh sách duyệt chưa
      const existingIdx = this.applications.findIndex((item) => item.isUserSubmitted || item.shop.toLowerCase() === shopName.toLowerCase());

      const userApp: VendorApplication = {
        id: existingIdx >= 0 ? this.applications[existingIdx].id : 999,
        shop: shopName,
        owner: draft.contactInfo?.representativeName || 'Người dùng vừa đăng ký',
        email: draft.contactInfo?.email || 'user.shop@gmail.com',
        phone: draft.contactInfo?.phone || '0988 999 888',
        model: draft.shopInfo?.businessType === 'INDIVIDUAL' ? 'Cá nhân' : 'Hộ kinh doanh',
        cat: draft.shopInfo?.primaryCategory || 'Thời trang & Phụ kiện',
        desc: draft.shopInfo?.description || 'Gian hàng đăng ký mới từ trang người bán.',
        pickup: `${draft.contactInfo?.detailedAddress || 'Kho lấy hàng'}, ${draft.contactInfo?.ward || ''}, ${draft.contactInfo?.district || ''}, ${draft.contactInfo?.province || ''}`.replace(/^,\s*|,\s*$/g, ''),
        tax: draft.kycInfo?.taxCode || '—',
        at: draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString('vi-VN') + ' ' + new Date(draft.updatedAt).toTimeString().slice(0, 5) : 'Hôm nay',
        status: (draft.status === 'APPROVED' || draft.status === 'REJECTED' || draft.status === 'NEED_INFO' || draft.status === 'RESUBMITTED')
          ? draft.status
          : 'PENDING',
        docs: [
          'CCCD mặt trước',
          'CCCD mặt sau',
          ...(draft.kycInfo?.businessLicenseUrl ? ['Giấy phép kinh doanh'] : []),
        ],
        req: draft.req || undefined,
        rnote: draft.adminFeedback || undefined,
        reason: draft.status === 'REJECTED' ? draft.adminFeedback : undefined,
        h: [
          { t: 'Gần đây', x: 'Người dùng nộp hồ sơ mở shop từ kênh Người bán' },
          ...(draft.adminFeedback ? [{ t: 'Cập nhật', x: `Phản hồi: ${draft.adminFeedback}` }] : []),
        ],
        isUserSubmitted: true,
      };

      if (existingIdx >= 0) {
        this.applications[existingIdx] = { ...this.applications[existingIdx], ...userApp };
      } else {
        // Đưa đơn mới của người dùng lên đầu danh sách để Admin thấy ngay lập tức
        this.applications.unshift(userApp);
      }
      this.persist();
    } catch (e) {
      console.error('Lỗi khi đồng bộ đơn đăng ký của người dùng:', e);
    }
  }

  private persist(): void {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(this.applications));
  }

  getVendors(params: { status?: string; q?: string } = {}): Observable<VendorApplication[]> {
    if (this.http) {
      let httpParams = new HttpParams().set('page', '0').set('size', '100');
      if (params.status && params.status !== 'ALL' && params.status !== 'TODO') {
        httpParams = httpParams.set('status', params.status);
      }
      if (params.q?.trim()) httpParams = httpParams.set('keyword', params.q.trim());
      return this.http.get<{ items: AdminVendorListItem[] }>(this.apiUrl, { params: httpParams }).pipe(
        map((page) => {
          this.applications = (page.items || []).map((item) => this.fromApi(item));
          return structuredClone(this.applications);
        })
      );
    }
    this.syncUserOnboardingDraft();
    const q = (params.q ?? '').trim().toLocaleLowerCase('vi');
    const phoneQuery = q.replace(/\s+/g, '');

    const filtered = this.applications.filter((vendor) => {
      let matchesStatus = true;
      if (params.status && params.status !== 'ALL') {
        if (params.status === 'TODO') {
          matchesStatus = vendor.status === 'PENDING' || vendor.status === 'RESUBMITTED';
        } else {
          matchesStatus = vendor.status === params.status;
        }
      }
      const searchable = [vendor.shop, vendor.owner, vendor.email].join(' ').toLocaleLowerCase('vi');
      return matchesStatus && (!q || searchable.includes(q) || vendor.phone.replace(/\s+/g, '').includes(phoneQuery));
    });

    return of(structuredClone(filtered)).pipe(delay(100));
  }

  getVendor(id: number): Observable<VendorApplication> {
    if (this.http) {
      return this.getVendors().pipe(
        map((vendors) => vendors.find((vendor) => vendor.id === id)),
        map((vendor) => {
          if (!vendor) throw new HttpErrorResponse({ status: 404, error: { code: 'VENDOR_NOT_FOUND' } });
          return vendor;
        })
      );
    }
    this.syncUserOnboardingDraft();
    const vendor = this.applications.find((item) => item.id === id);
    return vendor ? of(structuredClone(vendor)).pipe(delay(80)) : this.fail(404, 'VENDOR_NOT_FOUND');
  }

  approveVendor(id: number): Observable<VendorApplication> {
    if (this.http) {
      return this.reviewApiVendor(id, { action: 'APPROVE' });
    }
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'PENDING' && vendor.status !== 'RESUBMITTED') {
      return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    }

    const now = this.formatNow();
    vendor.status = 'APPROVED';
    vendor.by = 'namnguyen20012005@gmail.com';
    vendor.dat = now;
    (vendor.h = vendor.h || []).push({ t: now, x: 'Admin duyệt hồ sơ. Gian hàng đã được kích hoạt.' });

    // Đồng bộ ngược lại cho người dùng
    if (vendor.isUserSubmitted) {
      this.syncBackToUserOnboarding('APPROVED');
    }

    this.persist();
    return of(structuredClone(vendor)).pipe(delay(100));
  }

  rejectVendor(id: number, reason: string): Observable<VendorApplication> {
    const trimmedReason = reason.trim();
    if (this.http) {
      if (trimmedReason.length < 10) return this.fail(422, 'INVALID_REJECT_REASON');
      return this.reviewApiVendor(id, { action: 'REJECT', rejectReason: trimmedReason });
    }
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'PENDING' && vendor.status !== 'RESUBMITTED') {
      return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    }
    if (trimmedReason.length < 10) return this.fail(422, 'INVALID_REJECT_REASON');

    const now = this.formatNow();
    vendor.status = 'REJECTED';
    vendor.reason = trimmedReason;
    vendor.dat = now;
    (vendor.h = vendor.h || []).push({ t: now, x: `Admin từ chối: ${trimmedReason}` });

    // Đồng bộ ngược lại cho người dùng
    if (vendor.isUserSubmitted) {
      this.syncBackToUserOnboarding('REJECTED', trimmedReason);
    }

    this.persist();
    return of(structuredClone(vendor)).pipe(delay(100));
  }

  requestAdditionalInfo(id: number, items: string[], note: string): Observable<VendorApplication> {
    const trimmedNote = note.trim();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.status !== 'PENDING' && vendor.status !== 'RESUBMITTED') {
      return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    }
    if (!items.length || trimmedNote.length < 10) return this.fail(422, 'INVALID_REQUEST');

    const now = this.formatNow();
    vendor.status = 'NEED_INFO';
    vendor.req = [...items];
    vendor.rnote = trimmedNote;
    vendor.due = '28/10/2026';
    (vendor.h = vendor.h || []).push({ t: now, x: `Admin yêu cầu bổ sung: ${items.join(', ')}` });

    // Đồng bộ ngược lại cho người dùng sang trạng thái REVISION_NEEDED
    if (vendor.isUserSubmitted) {
      this.syncBackToUserOnboarding('REVISION_NEEDED', trimmedNote, items);
    }

    this.persist();
    return of(structuredClone(vendor)).pipe(delay(100));
  }

  terminateVendorAccount(id: number, violationType: string, reason: string): Observable<VendorApplication> {
    const trimmedReason = reason.trim();
    if (this.http) {
      if (trimmedReason.length < 10) return this.fail(422, 'INVALID_REASON');
      return this.http.post(`${this.apiUrl}/${id}/terminate`, { violationType, reason: trimmedReason }).pipe(
        map(() => this.updatedApiApplication(id, 'REJECTED', `[${violationType}] ${trimmedReason}`)),
        catchError((error) => throwError(() => error))
      );
    }
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

    if (vendor.isUserSubmitted) {
      this.syncBackToUserOnboarding('REJECTED', `Tài khoản bị xóa do vi phạm chính sách cấm: ${trimmedReason}`);
    }

    this.persist();
    return of(structuredClone(vendor)).pipe(delay(100));
  }

  simulateVendorResubmission(id: number): Observable<VendorApplication> {
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

    if (vendor.isUserSubmitted) {
      this.syncBackToUserOnboarding('PENDING');
    }

    this.persist();
    return of(structuredClone(vendor)).pipe(delay(100));
  }

  private syncBackToUserOnboarding(status: string, feedback?: string, reqItems?: string[]): void {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      draft.status = status;
      if (feedback) draft.adminFeedback = feedback;
      if (reqItems) draft.req = reqItems;
      draft.updatedAt = new Date().toISOString();
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Lỗi khi đồng bộ ngược cho người dùng:', e);
    }
  }

  private reviewApiVendor(id: number, request: { action: 'APPROVE' | 'REJECT'; rejectReason?: string }): Observable<VendorApplication> {
    return this.http!.post<{ data: { approvalStatus: string; rejectReason?: string } }>(
      `${this.apiUrl}/${id}/review`, request
    ).pipe(
      map((response) => this.updatedApiApplication(
        id,
        response.data.approvalStatus as VendorApprovalStatus,
        response.data.rejectReason
      ))
    );
  }

  private updatedApiApplication(id: number, status: VendorApprovalStatus, reason?: string): VendorApplication {
    const current = this.applications.find((vendor) => vendor.id === id);
    if (!current) throw new HttpErrorResponse({ status: 404, error: { code: 'VENDOR_NOT_FOUND' } });
    return { ...current, status, reason };
  }

  private fromApi(item: AdminVendorListItem): VendorApplication {
    return {
      id: item.id,
      shop: item.shopName || item.businessName,
      owner: item.ownerName || '',
      email: item.ownerEmail || '',
      phone: item.ownerPhone || '',
      model: 'Cá nhân',
      cat: '',
      pickup: item.shopPickupAddress || '',
      at: item.createdAt || '',
      status: item.approvalStatus as VendorApprovalStatus,
      docs: item.kycDocumentUrl ? [item.kycDocumentUrl] : [],
      reason: item.rejectReason,
    };
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
    return timer(80).pipe(map(() => {
      throw new HttpErrorResponse({ status, error: { code } });
    }));
  }
}

interface AdminVendorListItem {
  id: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessName: string;
  shopName?: string;
  shopPickupAddress?: string;
  kycDocumentUrl?: string;
  approvalStatus: string;
  rejectReason?: string;
  createdAt?: string;
}
