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
        password: '',
        confirmPassword: '',
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
   * Tải dữ liệu ban đầu và đồng bộ trạng thái thực tế từ Server Database
   */
  loadInitialData(): void {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as VendorApplicationData;
        this.application.set(parsed);
        this.currentStatus.set(parsed.status || 'DRAFT');
      } catch (e) {
        console.error('Error parsing draft from localStorage', e);
      }
    }

    this.refreshStatus();
  }

  /**
   * Đồng bộ trạng thái thực tế từ Backend Database
   */
  refreshStatus(): Observable<ApplicationStatus | null> {
    const vendorId = localStorage.getItem('vic_registered_vendor_id') || '';
    const email = this.application().contactInfo.email || localStorage.getItem('currentUsername') || '';
    const phone = this.application().contactInfo.phone || '';

    let url = `${this.API}/status?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}`;
    if (vendorId) {
      url += `&vendorId=${encodeURIComponent(vendorId)}`;
    }

    return this.http.get<any>(url).pipe(
      catchError(() => this.http.get<any>(`${this.API}/me`)),
      catchError(() => of(null)),
      map((res) => {
        if (res?.data) {
          const v = res.data;
          const realStatus: ApplicationStatus = v.approvalStatus || 'PENDING';
          this.currentStatus.set(realStatus);

          const curr = this.application();
          const updated: VendorApplicationData = {
            ...curr,
            status: realStatus,
            adminFeedback: v.rejectReason || curr.adminFeedback || '',
            shopInfo: {
              ...curr.shopInfo,
              shopName: v.shop?.name || curr.shopInfo.shopName,
              description: v.shop?.description || curr.shopInfo.description,
              logoUrl: v.shop?.logo || curr.shopInfo.logoUrl,
            },
          };
          this.application.set(updated);
          localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
          return realStatus;
        }
        return null;
      })
    );
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
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    this.dashboardService.syncFromOnboarding(data);

    setTimeout(() => {
      this.isSavingDraft.set(false);
    }, 600);
  }

  /**
   * Nộp hồ sơ chính thức lên sàn (Chuyển sang trạng thái PENDING và lưu vào Database)
   */
  submitApplication(): Observable<boolean> {
    this.isSubmitting.set(true);
    const curr = this.application();
    const payload: VendorApplicationData = {
      ...curr,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };

    const addressParts = [
      curr.contactInfo.detailedAddress,
      curr.contactInfo.ward,
      curr.contactInfo.district,
      curr.contactInfo.province,
    ].filter(Boolean);
    const pickupAddress =
      addressParts.length > 0 ? addressParts.join(', ') : 'Chưa cập nhật địa chỉ lấy hàng';

    const kycDoc =
      curr.kycInfo.businessLicenseUrl ||
      curr.kycInfo.idCardFrontUrl ||
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80';

    const registerReq = {
      businessName: curr.shopInfo.shopName || curr.contactInfo.representativeName || 'Gian hàng kinh doanh',
      kycDocumentUrl: kycDoc,
      shopName: curr.shopInfo.shopName,
      logo: curr.shopInfo.logoUrl || null,
      banner: null,
      description: curr.shopInfo.description || '',
      pickupAddress: pickupAddress,
      email: curr.contactInfo.email,
      phone: curr.contactInfo.phone,
      password: curr.contactInfo.password || null,
      representativeName: curr.contactInfo.representativeName,
      businessType: curr.shopInfo.businessType,
      taxCode: curr.kycInfo.taxCode,
      idCardNumber: curr.kycInfo.idCardNumber,
      idCardFrontUrl: curr.kycInfo.idCardFrontUrl,
      idCardBackUrl: curr.kycInfo.idCardBackUrl,
      bankName: curr.kycInfo.bankName,
      bankAccountNumber: curr.kycInfo.bankAccountNumber,
      bankAccountName: curr.kycInfo.bankAccountName,
    };

    return this.http.post<any>(`${this.API}/register`, registerReq).pipe(
      tap((res) => {
        if (res?.data?.id) {
          localStorage.setItem('vic_registered_vendor_id', String(res.data.id));
        }
        if (res?.data?.shop?.id) {
          localStorage.setItem('vic_registered_shop_id', String(res.data.shop.id));
        }
        if (res?.data?.token) {
          localStorage.setItem('token', res.data.token);
          localStorage.setItem('role', 'VENDOR');
        }
        if (res?.data?.userId) {
          localStorage.setItem('userId', String(res.data.userId));
        }
        if (payload.contactInfo.email) {
          localStorage.setItem('currentUsername', payload.contactInfo.email);
        }
        if (payload.contactInfo.representativeName) {
          localStorage.setItem('fullName', payload.contactInfo.representativeName);
        }

        const realStatus: ApplicationStatus = res?.data?.approvalStatus || 'APPROVED';
        payload.status = realStatus;
        this.application.set(payload);
        this.currentStatus.set(realStatus);
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        this.dashboardService.syncFromOnboarding(payload);
        this.isSubmitting.set(false);
      }),
      map(() => true),
      catchError((err) => {
        this.isSubmitting.set(false);
        const errorMsg =
          err.error?.message || err.error?.error || 'Có lỗi xảy ra khi gửi hồ sơ đăng ký lên hệ thống.';
        alert(errorMsg);
        return of(false);
      })
    );
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
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
  }
}
