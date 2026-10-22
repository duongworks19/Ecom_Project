import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, catchError, delay, map } from 'rxjs';
import {
  VendorApplicationData,
  ApplicationStatus,
  CheckShopNameResponse,
  ShopInfo,
  ContactWarehouseInfo,
  KycInfo,
} from '../models/seller-onboarding.model';
import { AuthService } from '../../../core/services/auth.service';
import { SellerDashboardService } from '../../seller-dashboard/services/seller-dashboard.service';

const DRAFT_STORAGE_KEY = 'vic_seller_onboarding_draft';
export const VENDOR_APPLICATIONS_STORAGE_KEY = 'vic_vendor_applications_list';

@Injectable({ providedIn: 'root' })
export class SellerOnboardingService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly dashboardService = inject(SellerDashboardService);
  private readonly API = 'http://localhost:9090/api/vendors';

  // Signals reactive state
  readonly application = signal<VendorApplicationData>(this.getInitialState());
  readonly currentStatus = signal<ApplicationStatus>('NOT_STARTED');
  readonly isSavingDraft = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  constructor() {
    this.loadInitialData();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === DRAFT_STORAGE_KEY || e.key === VENDOR_APPLICATIONS_STORAGE_KEY) {
          this.loadInitialData();
        }
      });
      window.addEventListener('vic-vendor-applications-changed', () => {
        this.loadInitialData();
      });
    }
  }

  private getInitialState(): VendorApplicationData {
    return {
      shopInfo: {
        shopName: '',
        businessType: 'INDIVIDUAL',
        primaryCategory: 'Thời trang & Phụ kiện',
        description: '',
        logoUrl: '',
      },
      contactInfo: {
        representativeName: '',
        phone: '',
        email: '',
        province: 'Hà Nội',
        district: 'Quận Cầu Giấy',
        ward: 'Phường Dịch Vọng Hậu',
        detailedAddress: '',
        pickupNote: '',
      },
      kycInfo: {
        idCardNumber: '',
        idCardFrontUrl: '',
        idCardBackUrl: '',
        businessLicenseUrl: '',
        taxCode: '',
        bankName: 'Vietcombank',
        bankAccountNumber: '',
        bankAccountName: '',
      },
      status: 'NOT_STARTED',
    };
  }

  /**
   * Tải dữ liệu ban đầu từ LocalStorage hoặc server
   */
  loadInitialData(): void {
    if (typeof window !== 'undefined') {
      const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft) as VendorApplicationData;
          this.application.set(parsed);
          this.currentStatus.set(parsed.status || 'DRAFT');
          return;
        } catch (e) {
          console.error('Error parsing draft from localStorage', e);
        }
      }
    }

    // Nếu đã đăng nhập, thử load từ server
    if (this.authService.isLoggedIn()) {
      this.http
        .get<any>(`${this.API}/me`)
        .pipe(catchError(() => of(null)))
        .subscribe((res) => {
          if (res?.data) {
            const v = res.data;
            this.currentStatus.set(v.approvalStatus || 'PENDING');
          }
        });
    }
  }

  /**
   * Kiểm tra trùng tên shop realtime (debounce ở component)
   */
  checkShopNameAvailable(name: string): Observable<CheckShopNameResponse> {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || trimmed.length < 3) {
      return of({ isAvailable: false, message: 'Tên shop phải từ 3 ký tự trở lên' });
    }

    return this.http.get<CheckShopNameResponse>(`${this.API}/check-name?name=${encodeURIComponent(trimmed)}`).pipe(
      catchError(() => {
        // Mock fallback an toàn cho môi trường test
        const reserved = ['vicmart', 'admin', 'official', 'shopee', 'lazada', 'tiki'];
        const isTaken = reserved.includes(trimmed);
        return of({
          isAvailable: !isTaken,
          message: isTaken ? 'Tên shop đã được đăng ký hoặc nằm trong danh sách hạn chế' : 'Tên shop hợp lệ và khả dụng!',
        });
      })
    );
  }

  /**
   * Cập nhật thông tin từng bước & tự động lưu nháp
   */
  updateShopInfo(info: ShopInfo): void {
    const curr = this.application();
    const updated: VendorApplicationData = {
      ...curr,
      shopInfo: info,
      status: curr.status === 'NOT_STARTED' ? 'DRAFT' : curr.status,
    };
    this.saveDraftLocally(updated);
  }

  updateContactInfo(info: ContactWarehouseInfo): void {
    const curr = this.application();
    const updated: VendorApplicationData = {
      ...curr,
      contactInfo: info,
      status: curr.status === 'NOT_STARTED' ? 'DRAFT' : curr.status,
    };
    this.saveDraftLocally(updated);
  }

  updateKycInfo(info: KycInfo): void {
    const curr = this.application();
    const updated: VendorApplicationData = {
      ...curr,
      kycInfo: info,
      status: curr.status === 'NOT_STARTED' ? 'DRAFT' : curr.status,
    };
    this.saveDraftLocally(updated);
  }

  /**
   * Lưu nháp vào LocalStorage và đồng bộ ngầm lên server
   */
  saveDraftLocally(data: VendorApplicationData): void {
    this.isSavingDraft.set(true);
    this.application.set(data);
    this.currentStatus.set(data.status);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    }
    this.dashboardService.syncFromOnboarding(data);

    setTimeout(() => {
      this.isSavingDraft.set(false);
    }, 600);
  }

  /**
   * Nộp hồ sơ chính thức lên sàn (Chuyển sang trạng thái PENDING)
   */
  submitApplication(): Observable<boolean> {
    this.isSubmitting.set(true);
    const curr = this.application();
    const payload: VendorApplicationData = {
      ...curr,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };

    const registerReq = {
      businessName: curr.shopInfo.shopName,
      kycDocumentUrl: curr.kycInfo.idCardFrontUrl || 'https://via.placeholder.com/300',
      shopName: curr.shopInfo.shopName,
      logo: curr.shopInfo.logoUrl,
      banner: null,
      description: curr.shopInfo.description,
      pickupAddress: `${curr.contactInfo.detailedAddress}, ${curr.contactInfo.ward}, ${curr.contactInfo.district}, ${curr.contactInfo.province}`,
    };

    // Đồng bộ ngay lập tức sang danh sách chờ duyệt của Admin
    this.syncApplicationToAdminList(payload);

    return this.http.post<any>(`${this.API}/register`, registerReq).pipe(
      delay(400),
      catchError(() => of({ data: payload })),
      tap((res) => {
        if (res?.data?.id) {
          payload.id = res.data.id;
        }
        this.application.set(payload);
        this.currentStatus.set('PENDING');
        if (typeof window !== 'undefined') {
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        }
        this.syncApplicationToAdminList(payload);
        this.dashboardService.syncFromOnboarding(payload);
        this.isSubmitting.set(false);
      }),
      delay(150),
      map(() => true),
      catchError(() => {
        this.isSubmitting.set(false);
        return of(false);
      })
    );
  }

  /**
   * Đồng bộ hồ sơ vừa đăng ký sang danh sách quản lý duyệt vendor của Admin
   */
  private syncApplicationToAdminList(payload: VendorApplicationData): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(VENDOR_APPLICATIONS_STORAGE_KEY);
      let list: any[] = raw ? JSON.parse(raw) : [];

      const d = new Date();
      const atStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

      const adminRecord = {
        id: payload.id || Date.now(),
        shop: payload.shopInfo.shopName,
        owner: payload.contactInfo.representativeName || 'Chủ gian hàng',
        email: payload.contactInfo.email || 'seller@vicmart.vn',
        phone: payload.contactInfo.phone || '0901 234 567',
        model: payload.shopInfo.businessType === 'INDIVIDUAL' ? 'Cá nhân' : payload.shopInfo.businessType === 'HOUSEHOLD' ? 'Hộ kinh doanh' : 'Doanh nghiệp',
        cat: payload.shopInfo.primaryCategory || 'Thời trang & Phụ kiện',
        desc: payload.shopInfo.description || '',
        pickup: `${payload.contactInfo.detailedAddress}, ${payload.contactInfo.ward}, ${payload.contactInfo.district}, ${payload.contactInfo.province}`,
        tax: payload.kycInfo.taxCode || '—',
        at: atStr,
        status: payload.status === 'REVISION_NEEDED' ? 'NEED_INFO' : payload.status === 'APPROVED' ? 'APPROVED' : payload.status === 'REJECTED' ? 'REJECTED' : 'PENDING',
        docs: [
          'CCCD mặt trước',
          'CCCD mặt sau',
          ...(payload.kycInfo.businessLicenseUrl ? ['Giấy phép kinh doanh'] : [])
        ],
        h: [
          { t: atStr, x: 'Vendor gửi hồ sơ đăng ký gian hàng' }
        ]
      };

      const existingIdx = list.findIndex(
        (v) => (payload.id && v.id === payload.id) || (v.shop && v.shop.toLowerCase() === payload.shopInfo.shopName.toLowerCase())
      );

      if (existingIdx >= 0) {
        list[existingIdx] = { ...list[existingIdx], ...adminRecord };
      } else {
        list.unshift(adminRecord); // Đưa lên đầu danh sách để Admin thấy ngay lập tức
      }

      localStorage.setItem(VENDOR_APPLICATIONS_STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('vic-vendor-applications-changed', { detail: adminRecord }));
    } catch (e) {
      console.error('Failed to sync application to admin list', e);
    }
  }

  /**
   * Đặt trạng thái thử nghiệm cho demo/kiểm thử (DRAFT, PENDING, REVISION_NEEDED, APPROVED, REJECTED)
   */
  setDemoStatus(status: ApplicationStatus, feedback?: string): void {
    const updated: VendorApplicationData = {
      ...this.application(),
      status,
      adminFeedback: feedback || (status === 'REVISION_NEEDED' ? 'Ảnh mặt sau CCCD bị lóa ánh sáng, vui lòng tải lại ảnh rõ nét.' : ''),
    };
    this.application.set(updated);
    this.currentStatus.set(status);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
      this.syncApplicationToAdminList(updated);
    }
  }
}
