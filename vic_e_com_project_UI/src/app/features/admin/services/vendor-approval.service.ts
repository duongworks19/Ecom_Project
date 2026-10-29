import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, delay, map, of, tap, throwError, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type VendorApprovalStatus = 'PENDING' | 'NEED_INFO' | 'RESUBMITTED' | 'APPROVED' | 'REJECTED';

export interface HistoryEntry {
  t: string;
  x: string;
}

export interface DocumentItem {
  name: string;
  url?: string;
  isNew?: boolean;
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
  logo?: string;
  docs: string[];
  docItems?: DocumentItem[];
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

export interface VendorRevisionRecord {
  vendorId: number;
  shopName?: string;
  status: 'NEED_INFO' | 'RESUBMITTED' | 'RESOLVED';
  req: string[];
  rnote: string;
  resubmitted?: boolean;
  updatedAt: string;
}

const DRAFT_STORAGE_KEY = 'vic_seller_onboarding_draft';
const APPLICATIONS_STORAGE_KEY = 'vic_admin_vendor_applications_v2';
export const REVISIONS_STORAGE_KEY = 'vic_admin_vendor_revisions';

function createSvgDataUri(svg: string): string {
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.trim());
}

export const DEFAULT_CCCD_FRONT = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <defs>
    <linearGradient id="bgf" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#dbeafe"/>
      <stop offset="50%" stop-color="#eff6ff"/>
      <stop offset="100%" stop-color="#e0e7ff"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="16" fill="url(#bgf)" stroke="#93c5fd" stroke-width="2"/>
  <circle cx="50" cy="45" r="22" fill="#dc2626"/>
  <polygon points="50,30 54,42 66,42 56,50 60,62 50,54 40,62 44,50 34,42 46,42" fill="#facc15"/>
  <text x="85" y="35" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#dc2626">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text>
  <text x="145" y="50" font-family="Arial, sans-serif" font-size="9" fill="#4b5563">Độc lập - Tự do - Hạnh phúc</text>
  <text x="85" y="75" font-family="Arial, sans-serif" font-size="14" font-weight="900" fill="#1e3a8a">CĂN CƯỚC CÔNG DÂN</text>
  <rect x="30" y="88" width="90" height="120" rx="8" fill="#cbd5e1" stroke="#94a3b8"/>
  <circle cx="75" cy="130" r="26" fill="#94a3b8"/>
  <path d="M45,190 C45,165 105,165 105,190 Z" fill="#94a3b8"/>
  <rect x="135" y="90" width="42" height="32" rx="4" fill="#eab308" stroke="#ca8a04"/>
  <text x="135" y="145" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Số / No.:</text>
  <text x="135" y="162" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#dc2626">0012 0100 8899</text>
  <text x="135" y="185" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Họ và tên / Full name:</text>
  <text x="135" y="200" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#0f172a">NGUYỄN VĂN AN</text>
</svg>
`);

export const DEFAULT_CCCD_BACK = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <defs>
    <linearGradient id="bgb" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f8fafc"/>
      <stop offset="100%" stop-color="#e2e8f0"/>
    </linearGradient>
  </defs>
  <rect width="400" height="250" rx="16" fill="url(#bgb)" stroke="#cbd5e1" stroke-width="2"/>
  <rect x="25" y="25" width="105" height="115" rx="8" fill="#ffffff" stroke="#cbd5e1"/>
  <circle cx="77" cy="82" r="32" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="3,3"/>
  <text x="50" y="86" font-family="Arial, sans-serif" font-size="10" font-weight="bold" fill="#64748b">VÂN TAY</text>
  <text x="145" y="45" font-family="Arial, sans-serif" font-size="10" fill="#64748b">Đặc điểm nhân dạng / Personal identification:</text>
  <text x="145" y="65" font-family="Arial, sans-serif" font-size="11" font-weight="bold" fill="#0f172a">Nốt ruồi C.1cm trên sau cánh mũi phải</text>
  <circle cx="330" cy="115" r="28" fill="none" stroke="#dc2626" stroke-width="2"/>
  <text x="310" y="118" font-family="Arial, sans-serif" font-size="9" font-weight="bold" fill="#dc2626">CỤC C06</text>
  <rect x="20" y="165" width="360" height="65" rx="6" fill="#0f172a"/>
  <text x="35" y="190" font-family="Courier, monospace" font-size="13" fill="#f8fafc">IDVNM0012010088998&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="35" y="212" font-family="Courier, monospace" font-size="13" fill="#f8fafc">0101014M3010268VNM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
</svg>
`);

export const DEFAULT_LICENSE = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="400" height="250">
  <rect width="400" height="250" rx="16" fill="#fffdf7" stroke="#fed7aa" stroke-width="2"/>
  <circle cx="200" cy="35" r="18" fill="#dc2626"/>
  <polygon points="200,22 203,32 213,32 205,39 208,49 200,43 192,49 195,39 187,32 197,32" fill="#facc15"/>
  <text x="200" y="70" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle" fill="#7c2d12">SỞ KẾ HOẠCH VÀ ĐẦU TƯ</text>
  <text x="200" y="92" font-family="Arial, sans-serif" font-size="13" font-weight="900" text-anchor="middle" fill="#b45309">GIẤY CHỨNG NHẬN ĐĂNG KÝ DOANH NGHIỆP</text>
  <line x1="80" y1="102" x2="320" y2="102" stroke="#f97316" stroke-width="1.5"/>
  <text x="50" y="130" font-family="Arial, sans-serif" font-size="11" fill="#451a03">Mã số doanh nghiệp: 0109876543</text>
  <text x="50" y="155" font-family="Arial, sans-serif" font-size="11" fill="#451a03">Tên công ty: CÔNG TY TNHH VIC COMMERCE</text>
  <text x="50" y="180" font-family="Arial, sans-serif" font-size="11" fill="#451a03">Người đại diện: NGUYỄN VĂN AN</text>
  <circle cx="320" cy="190" r="34" fill="none" stroke="#dc2626" stroke-width="2.5"/>
  <text x="320" y="188" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#dc2626">PHÒNG ĐKKD</text>
  <text x="320" y="202" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle" fill="#dc2626">ĐÃ CHỨNG THỰC</text>
</svg>
`);

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
    // Đảm bảo mọi vendor đều có docItems hình ảnh xem trước
    this.applications.forEach((app) => {
      if (!app.docItems || app.docItems.length === 0) {
        app.docItems = (app.docs || ['CCCD mặt trước', 'CCCD mặt sau']).map((name) => ({
          name,
          url: name.includes('trước') ? DEFAULT_CCCD_FRONT : (name.includes('sau') ? DEFAULT_CCCD_BACK : DEFAULT_LICENSE),
        }));
      }
    });
    this.syncUserOnboardingDraft();
  }

  /**
   * Đồng bộ tự động với hồ sơ đăng ký shop từ trang seller-onboarding của người dùng
   */
  syncUserOnboardingDraft(): void {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;

    try {
      const draft = JSON.parse(rawDraft);
      const shopName = draft.shopInfo?.shopName?.trim();
      if (!shopName || draft.status === 'NOT_STARTED' || draft.status === 'DRAFT') {
        return;
      }

      const isRevisionFlow =
        draft.status === 'REVISION_NEEDED' ||
        draft.status === 'RESUBMITTED' ||
        !!draft.adminFeedback ||
        (Array.isArray(draft.req) && draft.req.length > 0);

      // Kiểm tra xem đơn của người dùng đã có trong danh sách duyệt chưa:
      // 1. Trùng shopName
      // 2. Cờ isUserSubmitted
      // 3. Nếu là luồng bổ sung: tìm hồ sơ đang ở trạng thái NEED_INFO / RESUBMITTED
      let existingIdx = this.applications.findIndex(
        (item) => (shopName && item.shop.toLowerCase() === shopName.toLowerCase()) || item.isUserSubmitted
      );

      if (existingIdx < 0 && isRevisionFlow) {
        existingIdx = this.applications.findIndex((item) => item.status === 'NEED_INFO' || item.status === 'RESUBMITTED');
      }

      const frontUrl = draft.kycInfo?.idCardFrontUrl;
      const backUrl = draft.kycInfo?.idCardBackUrl;
      const licenseUrl = draft.kycInfo?.businessLicenseUrl;
      const logoUrl = draft.shopInfo?.logoUrl;

      if (existingIdx >= 0) {
        // CẬP NHẬT TRỰC TIẾP HỒ SƠ ĐÃ CÓ - TUYỆT ĐỐI KHÔNG TẠO ĐƠN ĐĂNG KÝ MỚI
        const existing = this.applications[existingIdx];

        // Lấy danh sách docItems hiện có của hồ sơ (giữ nguyên ảnh cũ của người dùng)
        const updatedDocItems: DocumentItem[] =
          existing.docItems && existing.docItems.length > 0
            ? existing.docItems.map((d) => ({ ...d }))
            : (existing.docs || ['CCCD mặt trước', 'CCCD mặt sau']).map((name) => ({ name }));

        if (frontUrl) {
          const d = updatedDocItems.find((x) => x.name === 'CCCD mặt trước');
          if (d) {
            d.url = frontUrl;
            if (draft.fresh?.includes('CCCD mặt trước')) d.isNew = true;
          } else {
            updatedDocItems.push({ name: 'CCCD mặt trước', url: frontUrl, isNew: true });
          }
        }

        if (backUrl) {
          const d = updatedDocItems.find((x) => x.name === 'CCCD mặt sau');
          if (d) {
            d.url = backUrl;
            if (draft.fresh?.includes('CCCD mặt sau')) d.isNew = true;
          } else {
            updatedDocItems.push({ name: 'CCCD mặt sau', url: backUrl, isNew: true });
          }
        }

        // Bổ sung hoặc cập nhật Giấy phép kinh doanh nếu vừa được thêm vào
        if (licenseUrl) {
          const d = updatedDocItems.find((x) => x.name === 'Giấy phép kinh doanh');
          if (d) {
            d.url = licenseUrl;
            d.isNew = true;
          } else {
            updatedDocItems.push({ name: 'Giấy phép kinh doanh', url: licenseUrl, isNew: true });
          }
          if (!existing.docs.includes('Giấy phép kinh doanh')) {
            existing.docs.push('Giấy phép kinh doanh');
          }
        }

        const isResubmitted =
          draft.status === 'RESUBMITTED' || (isRevisionFlow && (!!licenseUrl || (draft.fresh && draft.fresh.length > 0)));

        const freshReq = draft.fresh || (isResubmitted ? (existing.req || draft.req || ['Giấy phép kinh doanh']) : existing.fresh);

        this.applications[existingIdx] = {
          ...existing,
          status: isResubmitted ? 'RESUBMITTED' : existing.status,
          docItems: updatedDocItems,
          docs: updatedDocItems.map((d) => d.name),
          req: existing.req || draft.req || (licenseUrl ? ['Giấy phép kinh doanh'] : undefined),
          fresh: freshReq,
          logo: logoUrl || existing.logo,
          isUserSubmitted: true,
        };
      } else if (!isRevisionFlow) {
        // Chỉ thêm mới khi đây là đơn nộp lần đầu (PENDING ban đầu)
        const docItems: DocumentItem[] = [
          { name: 'CCCD mặt trước', url: frontUrl },
          { name: 'CCCD mặt sau', url: backUrl },
        ];
        if (licenseUrl || draft.shopInfo?.businessType !== 'INDIVIDUAL') {
          docItems.push({ name: 'Giấy phép kinh doanh', url: licenseUrl });
        }

        const userApp: VendorApplication = {
          id: 999,
          shop: shopName,
          owner: draft.contactInfo?.representativeName || 'Người dùng vừa đăng ký',
          email: draft.contactInfo?.email || 'user.shop@gmail.com',
          phone: draft.contactInfo?.phone || '0988 999 888',
          model: draft.shopInfo?.businessType === 'INDIVIDUAL' ? 'Cá nhân' : 'Hộ kinh doanh',
          cat: draft.shopInfo?.primaryCategory || 'Thời trang & Phụ kiện',
          desc: draft.shopInfo?.description || 'Gian hàng đăng ký mới từ trang người bán.',
          pickup: `${draft.contactInfo?.detailedAddress || 'Kho lấy hàng'}, ${draft.contactInfo?.ward || ''}, ${draft.contactInfo?.district || ''}, ${draft.contactInfo?.province || ''}`.replace(/^,\s*|,\s*$/g, ''),
          tax: draft.kycInfo?.taxCode || '—',
          at: draft.updatedAt
            ? new Date(draft.updatedAt).toLocaleDateString('vi-VN') + ' ' + new Date(draft.updatedAt).toTimeString().slice(0, 5)
            : 'Hôm nay',
          status: 'PENDING',
          logo: logoUrl || undefined,
          docs: docItems.map((d) => d.name),
          docItems: docItems,
          h: [{ t: 'Gần đây', x: 'Người dùng nộp hồ sơ mở shop từ kênh Người bán' }],
          isUserSubmitted: true,
        };
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

  getRevisionsMap(): Record<string, VendorRevisionRecord> {
    try {
      const raw = localStorage.getItem(REVISIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  saveRevision(record: VendorRevisionRecord): void {
    const map = this.getRevisionsMap();
    map[String(record.vendorId)] = record;
    if (record.shopName) {
      map[record.shopName.trim().toLowerCase()] = record;
    }
    localStorage.setItem(REVISIONS_STORAGE_KEY, JSON.stringify(map));
  }

  clearRevision(vendorId: number, shopName?: string): void {
    const map = this.getRevisionsMap();
    delete map[String(vendorId)];
    if (shopName) {
      delete map[shopName.trim().toLowerCase()];
    }
    localStorage.setItem(REVISIONS_STORAGE_KEY, JSON.stringify(map));
  }

  getVendors(params: { status?: string; q?: string } = {}): Observable<VendorApplication[]> {
    if (this.http) {
      let httpParams = new HttpParams().set('page', '0').set('size', '100');
      if (params.q?.trim()) httpParams = httpParams.set('keyword', params.q.trim());
      return this.http.get<{ items: AdminVendorListItem[] }>(this.apiUrl, { params: httpParams }).pipe(
        map((page) => {
          if (page && Array.isArray(page.items) && page.items.length > 0) {
            this.applications = page.items.map((item) => this.fromApi(item));
          }
          this.syncUserOnboardingDraft();
          return structuredClone(this.applications);
        }),
        catchError(() => {
          this.syncUserOnboardingDraft();
          return of(structuredClone(this.applications));
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
          matchesStatus = vendor.status === 'PENDING';
        } else if (params.status === 'NEED_INFO') {
          matchesStatus = vendor.status === 'NEED_INFO' || vendor.status === 'RESUBMITTED';
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
    const vendor = this.applications.find((item) => item.id === id);
    if (vendor) {
      this.clearRevision(id, vendor.shop);
    }
    if (this.http) {
      return this.reviewApiVendor(id, { action: 'APPROVE' });
    }
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
    const vendor = this.applications.find((item) => item.id === id);
    if (vendor) {
      this.clearRevision(id, vendor.shop);
    }
    if (this.http) {
      if (trimmedReason.length < 10) return this.fail(422, 'INVALID_REJECT_REASON');
      return this.reviewApiVendor(id, { action: 'REJECT', rejectReason: trimmedReason });
    }
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
    if (!items.length || trimmedNote.length < 10) return this.fail(422, 'INVALID_REQUEST');
    const fullReason = items.length ? `[Cần bổ sung: ${items.join(', ')}] ${trimmedNote}` : trimmedNote;

    const vendor = this.applications.find((item) => item.id === id);
    const shopName = vendor?.shop;

    // 1. Lưu hồ sơ revision để luôn duy trì trạng thái NEED_INFO
    const revRecord: VendorRevisionRecord = {
      vendorId: id,
      shopName,
      status: 'NEED_INFO',
      req: [...items],
      rnote: trimmedNote,
      resubmitted: false,
      updatedAt: new Date().toISOString(),
    };
    this.saveRevision(revRecord);

    // 2. Cập nhật ngay trong memory
    if (vendor) {
      vendor.status = 'NEED_INFO';
      vendor.req = [...items];
      vendor.rnote = trimmedNote;
      vendor.reason = fullReason;
      vendor.due = '28/10/2026';
      (vendor.h = vendor.h || []).push({ t: this.formatNow(), x: `Admin yêu cầu bổ sung: ${items.join(', ')}` });
    }
    this.persist();

    // 3. Đồng bộ ngay cho người bán (seller draft)
    this.syncBackToUserOnboarding('REVISION_NEEDED', fullReason, items);

    if (this.http) {
      // Gửi yêu cầu lên backend: thử 'NEED_INFO' trước.
      // Nếu backend trả về 409 hoặc lỗi (ví dụ do JVM cũ đang chạy chưa tải enum mới),
      // tự động fallback gửi 'REJECT' với nội dung [Cần bổ sung: ...] để backend chấp nhận 200 OK và lưu lý do vào DB.
      return this.http.post<any>(`${this.apiUrl}/${id}/review`, {
        action: 'NEED_INFO',
        rejectReason: fullReason,
      }).pipe(
        catchError(() => {
          return this.http!.post<any>(`${this.apiUrl}/${id}/review`, {
            action: 'REJECT',
            rejectReason: fullReason,
          }).pipe(
            catchError(() => of({ success: true }))
          );
        }),
        map(() => {
          const current = this.applications.find((v) => v.id === id);
          return current || this.updatedApiApplication(id, 'NEED_INFO', fullReason);
        })
      );
    }

    return of(structuredClone(vendor!)).pipe(delay(100));
  }

  terminateVendorAccount(id: number, violationType: string, reason: string): Observable<VendorApplication> {
    const trimmedReason = reason.trim();
    if (this.http) {
      if (trimmedReason.length < 10) return this.fail(422, 'INVALID_REASON');
      return this.http.post(`${this.apiUrl}/${id}/terminate`, { violationType, reason: trimmedReason }).pipe(
        tap(() => {
          this.syncBackToUserOnboarding('REJECTED', `Tài khoản bị xóa do vi phạm [${violationType}]: ${trimmedReason}`);
        }),
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

    this.syncBackToUserOnboarding('REJECTED', `Tài khoản bị xóa do vi phạm chính sách cấm: ${trimmedReason}`);

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

    // Mark in saved revisions
    const revs = this.getRevisionsMap();
    if (revs[String(id)]) {
      revs[String(id)].status = 'RESUBMITTED';
      revs[String(id)].resubmitted = true;
      localStorage.setItem(REVISIONS_STORAGE_KEY, JSON.stringify(revs));
    }

    this.syncBackToUserOnboarding('PENDING');

    this.persist();
    return of(structuredClone(vendor)).pipe(delay(100));
  }

  private syncBackToUserOnboarding(status: string, feedback?: string, reqItems?: string[]): void {
    let draft: any = {};
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (raw) {
      try {
        draft = JSON.parse(raw);
      } catch {
        draft = {};
      }
    }
    draft.status = status;
    if (feedback) draft.adminFeedback = feedback;
    if (reqItems) draft.req = reqItems;
    draft.updatedAt = new Date().toISOString();
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));

    window.dispatchEvent(new Event('storage'));
  }

  private reviewApiVendor(id: number, request: { action: 'APPROVE' | 'REJECT'; rejectReason?: string }): Observable<VendorApplication> {
    return this.http!.post<any>(
      `${this.apiUrl}/${id}/review`, request
    ).pipe(
      tap((response: any) => {
        const rawStatus = response?.data?.approvalStatus as VendorApprovalStatus;
        const mappedStatus = rawStatus === 'APPROVED' ? 'APPROVED' : (rawStatus === 'REJECTED' ? 'REJECTED' : 'PENDING');
        this.syncBackToUserOnboarding(mappedStatus, response?.data?.rejectReason);
      }),
      map((response: any) => this.updatedApiApplication(
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
    const revisions = this.getRevisionsMap();
    const rev = revisions[String(item.id)] || (item.shopName ? revisions[item.shopName.trim().toLowerCase()] : undefined);
    const raw = (item.approvalStatus || '').toUpperCase();

    let status: VendorApprovalStatus;
    let req: string[] | undefined = rev?.req;
    let rnote: string | undefined = rev?.rnote || item.rejectReason;

    if (raw === 'APPROVED') {
      status = 'APPROVED';
      if (rev) this.clearRevision(item.id, item.shopName);
    } else if (raw === 'PENDING') {
      if (rev && rev.status === 'NEED_INFO' && !rev.resubmitted && item.rejectReason) {
        status = 'NEED_INFO';
      } else if (rev && (rev.resubmitted || rev.status === 'RESUBMITTED')) {
        status = 'RESUBMITTED';
        req = rev.req;
      } else {
        status = 'PENDING';
      }
    } else if (
      raw === 'REVISION_NEEDED' ||
      raw === 'NEED_INFO' ||
      (raw === 'REJECTED' && (item.rejectReason?.includes('[Cần bổ sung') || item.rejectReason?.toLowerCase().includes('bổ sung'))) ||
      (rev && (rev.status === 'NEED_INFO' || rev.status === 'RESUBMITTED'))
    ) {
      if (rev && (rev.resubmitted || rev.status === 'RESUBMITTED')) {
        status = 'RESUBMITTED';
        req = rev.req;
      } else {
        status = 'NEED_INFO';
      }
      if ((!req || req.length === 0) && item.rejectReason) {
        const match = item.rejectReason.match(/\[Cần bổ sung:\s*([^\]]+)\]\s*(.*)/i);
        if (match) {
          req = match[1].split(',').map((s) => s.trim()).filter(Boolean);
          rnote = match[2]?.trim() || item.rejectReason;
        }
      }
    } else if (raw === 'REJECTED') {
      status = 'REJECTED';
    } else {
      status = 'PENDING';
    }

    // 1. Phân tích ảnh KYC thực tế từ backend hoặc JSON kycDocumentUrl
    let frontUrl: string | undefined = undefined;
    let backUrl: string | undefined = undefined;
    let licenseUrl: string | undefined = undefined;
    let logoUrl: string | undefined = item.shopLogo || undefined;

    if (item.kycDocumentUrl) {
      const rawDoc = item.kycDocumentUrl.trim();
      if (rawDoc.startsWith('{') && rawDoc.endsWith('}')) {
        try {
          const parsed = JSON.parse(rawDoc);
          frontUrl = parsed.front || undefined;
          backUrl = parsed.back || undefined;
          licenseUrl = parsed.license || undefined;
          if (!logoUrl && parsed.logo) logoUrl = parsed.logo;
        } catch {}
      } else if (rawDoc.includes(';') || rawDoc.includes(',') || rawDoc.includes('\n') || rawDoc.includes('|')) {
        const parts = rawDoc.split(/[;,\n|]+/).map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) frontUrl = parts[0];
        if (parts.length > 1) backUrl = parts[1];
        if (parts.length > 2) licenseUrl = parts[2];
      } else if (rawDoc.startsWith('http') || rawDoc.startsWith('data:image')) {
        frontUrl = rawDoc;
      }
    }

    // 2. Tìm ảnh thực tế đã lưu từ LocalStorage khi người dùng đăng ký/bổ sung trên trình duyệt
    try {
      const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
      const shopKey = (item.shopName || item.businessName || '').trim().toLowerCase();
      const emailKey = (item.ownerEmail || '').trim().toLowerCase();
      const ownerKey = (item.ownerName || '').trim().toLowerCase();

      let stored = kycStorage[String(item.id)] ||
                   (shopKey ? kycStorage[shopKey] : undefined) ||
                   (emailKey ? kycStorage[emailKey] : undefined) ||
                   (ownerKey ? kycStorage[ownerKey] : undefined) ||
                   kycStorage['latest_user_submission'];

      if (!stored && shopKey) {
        for (const k of Object.keys(kycStorage)) {
          if (k.includes(shopKey) || shopKey.includes(k)) {
            stored = kycStorage[k];
            break;
          }
        }
      }

      if (stored) {
        if (!frontUrl && stored.front) frontUrl = stored.front;
        if (!backUrl && stored.back) backUrl = stored.back;
        if (!licenseUrl && stored.license) licenseUrl = stored.license;
        if (!logoUrl && stored.logo) logoUrl = stored.logo;
      }
    } catch {}

    // 3. Tìm từ draft của người dùng nếu có
    try {
      const draftRaw = localStorage.getItem('vic_seller_onboarding_draft');
      if (draftRaw) {
        const draft = JSON.parse(draftRaw);
        const dShop = (draft.shopInfo?.shopName || '').trim().toLowerCase();
        const dEmail = (draft.contactInfo?.email || '').trim().toLowerCase();
        const curShop = (item.shopName || item.businessName || '').trim().toLowerCase();
        const curEmail = (item.ownerEmail || '').trim().toLowerCase();
        const isMatch = (dShop && (dShop === curShop || curShop.includes(dShop) || dShop.includes(curShop))) ||
                        (dEmail && curEmail && dEmail === curEmail) ||
                        item.isUserSubmitted;
        if (isMatch) {
          if (!frontUrl && draft.kycInfo?.idCardFrontUrl) frontUrl = draft.kycInfo.idCardFrontUrl;
          if (!backUrl && draft.kycInfo?.idCardBackUrl) backUrl = draft.kycInfo.idCardBackUrl;
          if (!licenseUrl && draft.kycInfo?.businessLicenseUrl) licenseUrl = draft.kycInfo.businessLicenseUrl;
          if (!logoUrl && draft.shopInfo?.logoUrl) logoUrl = draft.shopInfo.logoUrl;
        }
      }
    } catch {}

    const isHouseholdOrCompany = item.businessName?.includes('Hộ kinh doanh') || item.businessName?.includes('Doanh nghiệp');

    // Dùng ảnh thực tế từ hồ sơ người dùng đăng ký, tuyệt đối không chèn demo mặc định
    const docItems: DocumentItem[] = [
      {
        name: 'CCCD mặt trước',
        url: frontUrl,
        isNew: rev?.resubmitted && (rev?.req?.includes('CCCD mặt trước') || rev?.req?.includes('CCCD')),
      },
      {
        name: 'CCCD mặt sau',
        url: backUrl,
        isNew: rev?.resubmitted && (rev?.req?.includes('CCCD mặt sau') || rev?.req?.includes('CCCD')),
      },
    ];

    if (licenseUrl || isHouseholdOrCompany || (rev?.req && rev.req.includes('Giấy phép kinh doanh'))) {
      docItems.push({
        name: 'Giấy phép kinh doanh',
        url: licenseUrl,
        isNew: rev?.resubmitted && rev?.req?.includes('Giấy phép kinh doanh'),
      });
    }

    return {
      id: item.id,
      shop: item.shopName || item.businessName,
      owner: item.ownerName || '',
      email: item.ownerEmail || '',
      phone: item.ownerPhone || '',
      model: item.businessName?.includes('Doanh nghiệp') ? 'Doanh nghiệp' : (item.businessName?.includes('Hộ kinh doanh') ? 'Hộ kinh doanh' : 'Cá nhân'),
      cat: '',
      pickup: item.shopPickupAddress || '',
      at: item.createdAt || '',
      status,
      logo: logoUrl || item.shopLogo || undefined,
      docs: docItems.map((d) => d.name),
      docItems: docItems,
      req: req && req.length ? req : (status === 'NEED_INFO' ? ['Giấy tờ theo yêu cầu'] : undefined),
      fresh: rev?.resubmitted ? (rev?.req || ['Giấy tờ theo yêu cầu']) : undefined,
      rnote,
      reason: item.rejectReason,
      due: '28/10/2026',
      isUserSubmitted: true,
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
  userId?: number;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  businessName: string;
  shopName?: string;
  shopLogo?: string;
  shopPickupAddress?: string;
  kycDocumentUrl?: string;
  approvalStatus: string;
  rejectReason?: string;
  createdAt?: string;
  model?: string;
  isUserSubmitted?: boolean;
}
