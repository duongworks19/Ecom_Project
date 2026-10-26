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
        businessType: '',
        primaryCategory: '',
        description: '',
        logoUrl: '',
      },
      contactInfo: {
        representativeName: '',
        phone: '',
        email: '',
        province: '',
        district: '',
        ward: '',
        detailedAddress: '',
        pickupNote: '',
      },
      kycInfo: {
        idCardNumber: '',
        idCardFrontUrl: '',
        idCardBackUrl: '',
        businessLicenseUrl: '',
        taxCode: '',
        bankName: '',
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
        // Kiểm tra loại bỏ dữ liệu test/mock cũ nếu có (ví dụ 'VIC MART' hoặc 'Hà Nội' hardcode)
        const isLegacyMock =
          !parsed ||
          parsed.shopInfo?.shopName?.trim().toLowerCase() === 'vic mart' ||
          (parsed.shopInfo?.businessType === 'INDIVIDUAL' && parsed.contactInfo?.province === 'Hà Nội' && parsed.contactInfo?.ward === 'Phường Dịch Vọng Hậu');

        if (isLegacyMock) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          this.application.set(this.getInitialState());
          this.currentStatus.set('NOT_STARTED');
        } else {
          this.application.set(parsed);
          this.currentStatus.set(parsed.status || 'DRAFT');
        }
      } catch (e) {
        console.error('Error parsing draft from localStorage', e);
        this.resetApplication();
      }
    }

    // Nếu đã đăng nhập, thử load từ server
    if (this.authService.isLoggedIn()) {
      this.http.get<any>(`${this.API}/me`).pipe(
        catchError(() => of(null))
      ).subscribe((res) => {
        if (res?.data) {
          const v = res.data;
          this.currentStatus.set(v.approvalStatus || 'PENDING');
        }
      });
    }
  }

  resetApplication(): void {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    this.application.set(this.getInitialState());
    this.currentStatus.set('NOT_STARTED');
  }

  /**
   * Kiểm tra trùng tên shop & từ nhạy cảm realtime
   */
  checkShopNameAvailable(name: string): Observable<CheckShopNameResponse> {
    const raw = (name || '').trim();
    if (!raw || raw.length < 3) {
      return of({ isAvailable: false, message: 'Tên gian hàng phải từ 3 ký tự trở lên' });
    }
    if (raw.length > 50) {
      return of({ isAvailable: false, message: 'Tên gian hàng không được vượt quá 50 ký tự' });
    }

    // Kiểm tra nhanh phía client các từ ngữ cấm / nhạy cảm / tên sàn
    const clientCheck = this.validateSensitiveAndReservedLocal(raw);
    if (!clientCheck.isAvailable) {
      return of(clientCheck);
    }

    return this.http.get<any>(`${this.API}/check-name?name=${encodeURIComponent(raw)}`).pipe(
      map((res: any) => {
        const data = res?.data || res;
        return {
          isAvailable: data?.isAvailable ?? false,
          message: data?.message || (data?.isAvailable ? 'Tên gian hàng hợp lệ và khả dụng' : 'Tên gian hàng đã tồn tại trên hệ thống'),
        };
      }),
      catchError(() => {
        return of({
          isAvailable: true,
          message: 'Tên gian hàng hợp lệ và khả dụng!',
        });
      })
    );
  }

  /**
   * Kiểm tra trùng email người phụ trách / shop realtime
   */
  checkEmailAvailable(email: string): Observable<{ isAvailable: boolean; message: string }> {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed) {
      return of({ isAvailable: false, message: 'Vui lòng nhập email' });
    }

    return this.http.get<any>(`${this.API}/check-email?email=${encodeURIComponent(trimmed)}`).pipe(
      map((res) => {
        const data = res?.data || res;
        return {
          isAvailable: !!data.isAvailable,
          message: data.message || (data.isAvailable ? 'Email hợp lệ và khả dụng' : 'Email này đã được sử dụng trên hệ thống'),
        };
      }),
      catchError(() => {
        return of({
          isAvailable: true,
          message: 'Email hợp lệ',
        });
      })
    );
  }

  validateSensitiveAndReservedLocal(name: string): CheckShopNameResponse {
    const lower = name.toLowerCase();
    const unaccented = this.removeVietnameseDiacritics(lower);
    const compact = unaccented.replace(/[^a-z0-9]/g, '');

    const reserved = [
      'vicmart', 'vic mart', 'vic_mart', 'vic-mart', 'admin', 'administrator', 'banquantri',
      'official', 'shopee', 'lazada', 'tiki', 'sendo', 'tiktokshop', 'tongdai', 'cskh', 'hotro'
    ];

    for (const r of reserved) {
      const rCompact = this.removeVietnameseDiacritics(r).replace(/[^a-z0-9]/g, '');
      if (compact.includes(rCompact)) {
        return {
          isAvailable: false,
          message: 'Tên gian hàng chứa từ khóa nhạy cảm hoặc trùng với tên sàn khác, vui lòng chọn tên khác',
        };
      }
    }

    const phrases = [
      'tai xiu', 'taixiu', 'tài xỉu', 'co bac', 'cờ bạc', 'danh bac', 'đánh bạc', 'lo de', 'lô đề', 'casino',
      'lua dao', 'lừa đảo', 'scam', 'scammer', 'ma tuy', 'ma túy', 'can sa', 'cần sa', 'thuoc phien', 'thuốc phiện',
      'gai goi', 'gái gọi', 'khoa than', 'khỏa thân', 'khieu dam', 'khiêu dâm', 'dam dang', 'dâm đãng',
      'kich duc', 'kích dục', 'do choi nguoi lon', 'đồ chơi người lớn', 'sex toy', 'sextoy', 'massage 18', '18+',
      'suc vat', 'súc vật', 'vu khi', 'vũ khí', 'sung dan', 'súng đạn', 'chat no', 'chất nổ',
      'du ma', 'đụ má', 'du me', 'đụ mẹ', 'dit me', 'địt mẹ', 'vai lon', 'vãi lồn', 'di cho', 'đĩ chó',
      'con di', 'con đĩ', 'ban dam', 'bán dâm', 'lam tinh', 'làm tình', 'thu dam', 'thủ dâm'
    ];

    for (const p of phrases) {
      const pUnacc = this.removeVietnameseDiacritics(p);
      if (lower.includes(p) || unaccented.includes(pUnacc)) {
        return {
          isAvailable: false,
          message: 'Tên gian hàng chứa từ ngữ nhạy cảm, vi phạm chuẩn mực của sàn',
        };
      }
    }

    const exactTokens = new Set([
      'địt', 'đụ', 'đù', 'lồn', 'cặc', 'buồi', 'dâm', 'đĩ',
      'fuck', 'fck', 'fuk', 'bitch', 'dick', 'pussy', 'asshole', 'cunt', 'bastard', 'nigger',
      'porn', 'xxx', 'sex', 'nude'
    ]);

    const tokens = lower.split(/[\s\-_.,!@#$%^&*()+=/\\|<>?:;"'{}[\]]+/);
    for (const tok of tokens) {
      if (exactTokens.has(tok)) {
        return {
          isAvailable: false,
          message: 'Tên gian hàng chứa từ ngữ thô tục, nhạy cảm không đúng chuẩn mực',
        };
      }
    }

    return { isAvailable: true, message: 'Tên gian hàng hợp lệ và khả dụng!' };
  }

  private removeVietnameseDiacritics(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'd');
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
      phone: curr.contactInfo.phone,
      email: curr.contactInfo.email,
    };

    return this.http.post<any>(`${this.API}/register`, registerReq).pipe(
      delay(800), // Tạo hiệu ứng mượt mà
      tap(() => {
        this.application.set(payload);
        this.currentStatus.set('PENDING');
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        localStorage.removeItem('vic_seller_products');
        window.dispatchEvent(new Event('storage'));
        this.dashboardService.syncFromOnboarding(payload);
        this.dashboardService.products.set([]);
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
