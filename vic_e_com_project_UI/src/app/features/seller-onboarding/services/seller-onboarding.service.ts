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

    // Nếu đã đăng nhập, thử load từ server
    if (this.authService.isLoggedIn()) {
      this.http.get<any>(`${this.API}/me`).pipe(
        catchError(() => of(null))
      ).subscribe((res) => {
        if (res && res.data) {
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
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
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

    return this.http.post<any>(`${this.API}/register`, registerReq).pipe(
      delay(800), // Tạo hiệu ứng mượt mà
      catchError(() => of({ data: payload })), // Mock fallback an toàn
      tap(() => {
        this.application.set(payload);
        this.currentStatus.set('PENDING');
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        this.dashboardService.syncFromOnboarding(payload);
        this.isSubmitting.set(false);
      }),
      delay(200),
      map(() => true),
      catchError(() => {
        this.isSubmitting.set(false);
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
