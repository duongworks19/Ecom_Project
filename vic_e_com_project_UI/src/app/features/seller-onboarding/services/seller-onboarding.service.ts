import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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

export interface SubmissionErrorInfo {
  message: string;
  field?: string;
  stepToFix?: number;
}

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
  readonly submissionError = signal<SubmissionErrorInfo | null>(null);

  constructor() {
    this.loadInitialData();
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', () => this.syncFromStorage());
    }
  }

  /**
   * Đồng bộ dữ liệu nháp/trạng thái từ LocalStorage khi có thay đổi (ví dụ: Admin vừa duyệt ở tab khác)
   */
  syncFromStorage(): void {
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!rawDraft) return;
    try {
      const draft = JSON.parse(rawDraft);
      if (draft && draft.status) {
        this.currentStatus.set(draft.status);
        const curr = this.application();
        this.application.set({
          ...curr,
          status: draft.status,
          adminFeedback: draft.adminFeedback || curr.adminFeedback,
          req: draft.req || curr.req,
          shopInfo: {
            ...curr.shopInfo,
            ...(draft.shopInfo || {}),
          },
          contactInfo: {
            ...curr.contactInfo,
            ...(draft.contactInfo || {}),
          },
          kycInfo: {
            ...curr.kycInfo,
            ...(draft.kycInfo || {}),
          },
          updatedAt: draft.updatedAt || curr.updatedAt,
        });
      }
    } catch { }
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
   * Đồng bộ trạng thái mới nhất từ máy chủ theo thời gian thực (tự động cập nhật khi Admin duyệt)
   */
  fetchCurrentStatusFromServer(): Observable<VendorApplicationData | null> {
    if (!this.authService.isLoggedIn()) {
      this.syncFromStorage();
      return of(this.application());
    }

    return this.http.get<any>(`${this.API}/me`).pipe(
      map((res: any) => {
        if (!res?.data) {
          this.syncFromStorage();
          return this.application();
        }

        const v = res.data;
        const rawStatus = (v.approvalStatus || '').toUpperCase();
        const reason = v.rejectReason || '';
        const isRevisionFromReason = reason.includes('[Cần bổ sung') || reason.toLowerCase().includes('bổ sung');

        // Kiểm tra trong bộ nhớ revision của admin
        let isRevisionFromStorage = false;
        let storageReq: string[] | undefined = undefined;
        try {
          const revs = JSON.parse(localStorage.getItem('vic_admin_vendor_revisions') || '{}');
          const myRev = revs[v.id] || (v.shop?.name ? revs[v.shop.name.toLowerCase()] : null);
          if (myRev && myRev.status === 'NEED_INFO' && !myRev.resubmitted) {
            isRevisionFromStorage = true;
            storageReq = myRev.req;
          }
        } catch { }

        let serverStatus: ApplicationStatus = 'PENDING';
        if (rawStatus === 'APPROVED') {
          serverStatus = 'APPROVED';
        } else if (rawStatus === 'NEED_INFO' || rawStatus === 'REVISION_NEEDED' || isRevisionFromReason || isRevisionFromStorage) {
          serverStatus = 'REVISION_NEEDED';
        } else if (rawStatus === 'REJECTED') {
          serverStatus = 'REJECTED';
        } else if (rawStatus === 'PENDING' || rawStatus === 'RESUBMITTED') {
          // Kiểm tra xem có trạng thái REVISION_NEEDED được gửi từ Admin trong draft không
          const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (rawDraft) {
            try {
              const draft = JSON.parse(rawDraft);
              if (draft.status === 'REVISION_NEEDED') {
                serverStatus = 'REVISION_NEEDED';
                if (draft.req) storageReq = draft.req;
              }
            } catch { }
          }
          if (serverStatus !== 'REVISION_NEEDED') {
            serverStatus = 'PENDING';
          }
        } else if (rawStatus) {
          serverStatus = rawStatus as ApplicationStatus;
        }

        this.currentStatus.set(serverStatus);

        const curr = this.application();
        const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        let draftFeedback = '';
        let draftReq: string[] | undefined = undefined;
        if (rawDraft) {
          try {
            const parsedDraft = JSON.parse(rawDraft);
            draftFeedback = parsedDraft?.adminFeedback || '';
            draftReq = parsedDraft?.req || undefined;
          } catch { }
        }

        let parsedReq: string[] | undefined = storageReq || draftReq;
        if (reason) {
          const m = reason.match(/\[Cần bổ sung:\s*([^\]]+)\]/i);
          if (m) {
            parsedReq = m[1].split(',').map((s: string) => s.trim()).filter(Boolean);
          }
        }

        let frontUrl = curr.kycInfo?.idCardFrontUrl || '';
        let backUrl = curr.kycInfo?.idCardBackUrl || '';
        let licenseUrl = curr.kycInfo?.businessLicenseUrl || '';
        let idNumber = curr.kycInfo?.idCardNumber || '';

        if (v.kycDocumentUrl) {
          const rawDoc = v.kycDocumentUrl.trim();
          if (rawDoc.startsWith('{') && rawDoc.endsWith('}')) {
            try {
              const parsed = JSON.parse(rawDoc);
              if (parsed.front) frontUrl = parsed.front;
              if (parsed.back) backUrl = parsed.back;
              if (parsed.license) licenseUrl = parsed.license;
              if (parsed.idNumber) idNumber = parsed.idNumber;
            } catch { }
          } else if (rawDoc.startsWith('http') || rawDoc.startsWith('data:image')) {
            frontUrl = rawDoc;
          }
        }

        try {
          const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
          const shopKey = (v.shop?.name || v.businessName || curr.shopInfo?.shopName || '').trim().toLowerCase();
          const stored = kycStorage[shopKey] || kycStorage[String(v.id)] || kycStorage['latest_user_submission'];
          if (stored) {
            if (!frontUrl && stored.front) frontUrl = stored.front;
            if (!backUrl && stored.back) backUrl = stored.back;
            if (!licenseUrl && stored.license) licenseUrl = stored.license;
            if (!idNumber && stored.idNumber) idNumber = stored.idNumber;
          }
        } catch { }

        const updated: VendorApplicationData = {
          ...curr,
          shopInfo: {
            ...curr.shopInfo,
            shopName: v.shop?.name || v.businessName || curr.shopInfo.shopName,
            description: v.shop?.description || curr.shopInfo.description,
            logoUrl: v.shop?.logo || curr.shopInfo.logoUrl,
          },
          contactInfo: {
            ...curr.contactInfo,
            representativeName: curr.contactInfo.representativeName || v.businessName || 'Người đại diện',
            phone: v.shop?.phone || curr.contactInfo.phone,
            email: v.shop?.email || curr.contactInfo.email,
            detailedAddress: v.shop?.pickupAddress || curr.contactInfo.detailedAddress,
          },
          kycInfo: {
            ...curr.kycInfo,
            idCardFrontUrl: frontUrl,
            idCardBackUrl: backUrl,
            businessLicenseUrl: licenseUrl,
            idCardNumber: idNumber || curr.kycInfo?.idCardNumber,
          },
          status: serverStatus,
          adminFeedback: v.rejectReason || draftFeedback || curr.adminFeedback,
          req: parsedReq || curr.req,
          updatedAt: curr.updatedAt || new Date().toISOString(),
        };

        this.application.set(updated);
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));

        // Nếu đã được duyệt (APPROVED), tự động kích hoạt quyền VENDOR trên giao diện
        return updated;
      }),
      catchError(() => {
        this.syncFromStorage();
        return of(this.application());
      })
    );
  }

  /**
   * Khởi tạo dữ liệu: luôn đảm bảo form mới hoàn toàn, không nạp thông tin người dùng cũ
   */
  loadInitialData(): void {
    // Chỉ xóa dữ liệu nháp cũ nếu hồ sơ chưa gửi hoặc là nháp rác, không xóa khi đang PENDING/REVISION_NEEDED/APPROVED
    const rawDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (rawDraft) {
      try {
        const draft = JSON.parse(rawDraft);
        if (draft.status === 'DRAFT' || draft.status === 'NOT_STARTED') {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }
    }
    this.application.set(this.getInitialState());
    this.currentStatus.set('NOT_STARTED');
    this.submissionError.set(null);

    // Kiểm tra trạng thái thực tế từ máy chủ
    if (this.authService.isLoggedIn()) {
      this.fetchCurrentStatusFromServer().subscribe();
    }
  }

  resetApplication(): void {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    this.application.set(this.getInitialState());
    this.currentStatus.set('NOT_STARTED');
    this.submissionError.set(null);
  }

  clearSubmissionError(): void {
    this.submissionError.set(null);
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
      catchError((err: HttpErrorResponse) => {
        const msg = err?.error?.message || 'Tên gian hàng này không khả dụng hoặc đã tồn tại';
        return of({ isAvailable: false, message: msg });
      })
    );
  }

  uploadImage(file: File, folder: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`http://localhost:9090/api/media/image?folder=${encodeURIComponent(folder)}`, formData).pipe(
      map(res => res?.data?.url || res?.url || '')
    );
  }

  checkEmailAvailable(email: string): Observable<{ isAvailable: boolean; message: string }> {
    const trimmed = (email || '').trim().toLowerCase();
    if (!trimmed) return of({ isAvailable: false, message: 'Vui lòng nhập email' });
    return this.http.get<any>(`${this.API}/check-email?email=${encodeURIComponent(trimmed)}`).pipe(
      map((res: any) => {
        const data = res?.data || res;
        return { isAvailable: !!data?.isAvailable, message: data?.message || 'Email hợp lệ' };
      }),
      catchError((err: HttpErrorResponse) => {
        const msg = err?.error?.message || 'Email này đã được sử dụng trên hệ thống';
        return of({ isAvailable: false, message: msg });
      })
    );
  }

  checkPhoneAvailable(phone: string): Observable<{ isAvailable: boolean; message: string }> {
    const trimmed = (phone || '').trim();
    if (!trimmed) return of({ isAvailable: false, message: 'Vui lòng nhập số điện thoại' });
    return this.http.get<any>(`${this.API}/check-phone?phone=${encodeURIComponent(trimmed)}`).pipe(
      map((res: any) => {
        const data = res?.data || res;
        return { isAvailable: !!data?.isAvailable, message: data?.message || 'Số điện thoại hợp lệ và khả dụng' };
      }),
      catchError((err: HttpErrorResponse) => {
        const msg = err?.error?.message || 'Số điện thoại này đã được sử dụng';
        return of({ isAvailable: false, message: msg });
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
          message: 'TÃªn gian hÃ ng chá»©a tá»« khÃ³a nháº¡y cáº£m hoáº·c trÃ¹ng vá»›i tÃªn sÃ n khÃ¡c, vui lÃ²ng chá»n tÃªn khÃ¡c',
        };
      }
    }

    const phrases = [
      'tai xiu', 'taixiu', 'tÃ i xá»‰u', 'co bac', 'cá» báº¡c', 'danh bac', 'Ä‘Ã¡nh báº¡c', 'lo de', 'lÃ´ Ä‘á»', 'casino',
      'lua dao', 'lá»«a Ä‘áº£o', 'scam', 'scammer', 'ma tuy', 'ma tÃºy', 'can sa', 'cáº§n sa', 'thuoc phien', 'thuá»‘c phiá»‡n',
      'gai goi', 'gÃ¡i gá»i', 'khoa than', 'khá»a thÃ¢n', 'khieu dam', 'khiÃªu dÃ¢m', 'dam dang', 'dÃ¢m Ä‘Ã£ng',
      'kich duc', 'kÃ­ch dá»¥c', 'do choi nguoi lon', 'Ä‘á»“ chÆ¡i ngÆ°á»i lá»›n', 'sex toy', 'sextoy', 'massage 18', '18+',
      'suc vat', 'sÃºc váº­t', 'vu khi', 'vÅ© khÃ­', 'sung dan', 'sÃºng Ä‘áº¡n', 'chat no', 'cháº¥t ná»•',
      'du ma', 'Ä‘á»¥ mÃ¡', 'du me', 'Ä‘á»¥ máº¹', 'dit me', 'Ä‘á»‹t máº¹', 'vai lon', 'vÃ£i lá»“n', 'di cho', 'Ä‘Ä© chÃ³',
      'con di', 'con Ä‘Ä©', 'ban dam', 'bÃ¡n dÃ¢m', 'lam tinh', 'lÃ m tÃ¬nh', 'thu dam', 'thá»§ dÃ¢m'
    ];

    for (const p of phrases) {
      const pUnacc = this.removeVietnameseDiacritics(p);
      if (lower.includes(p) || unaccented.includes(pUnacc)) {
        return {
          isAvailable: false,
          message: 'TÃªn gian hÃ ng chá»©a tá»« ngá»¯ nháº¡y cáº£m, vi pháº¡m chuáº©n má»±c cá»§a sÃ n',
        };
      }
    }

    const exactTokens = new Set([
      'Ä‘á»‹t', 'Ä‘á»¥', 'Ä‘Ã¹', 'lá»“n', 'cáº·c', 'buá»“i', 'dÃ¢m', 'Ä‘Ä©',
      'fuck', 'fck', 'fuk', 'bitch', 'dick', 'pussy', 'asshole', 'cunt', 'bastard', 'nigger',
      'porn', 'xxx', 'sex', 'nude'
    ]);

    const tokens = lower.split(/[\s\-_.,!@#$%^&*()+=/\\|<>?:;"'{}[\]]+/);
    for (const tok of tokens) {
      if (exactTokens.has(tok)) {
        return {
          isAvailable: false,
          message: 'TÃªn gian hÃ ng chá»©a tá»« ngá»¯ thÃ´ tá»¥c, nháº¡y cáº£m khÃ´ng Ä‘Ãºng chuáº©n má»±c',
        };
      }
    }

    return { isAvailable: true, message: 'TÃªn gian hÃ ng há»£p lá»‡ vÃ  kháº£ dá»¥ng!' };
  }

  private removeVietnameseDiacritics(str: string): string {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/Ä‘/g, 'd')
      .replace(/Ä/g, 'd');
  }

  /**
   * Cáº­p nháº­t thÃ´ng tin tá»«ng bÆ°á»›c & tá»± Ä‘á»™ng lÆ°u nhÃ¡p
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
   * LÆ°u nhÃ¡p vÃ o LocalStorage vÃ  Ä‘á»“ng bá»™ ngáº§m lÃªn server
   */
  saveDraftLocally(data: VendorApplicationData): void {
    this.isSavingDraft.set(true);
    this.application.set(data);
    this.currentStatus.set(data.status);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    this.dashboardService.syncFromOnboarding(data);

    // Lưu ảnh KYC và logo vào persistent storage
    try {
      const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
      const shopKey = (data.shopInfo?.shopName || '').trim().toLowerCase();
      if (shopKey) {
        kycStorage[shopKey] = {
          front: data.kycInfo?.idCardFrontUrl || '',
          back: data.kycInfo?.idCardBackUrl || '',
          license: data.kycInfo?.businessLicenseUrl || '',
          idNumber: data.kycInfo?.idCardNumber || '',
          logo: data.shopInfo?.logoUrl || '',
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem('vic_vendor_kyc_storage', JSON.stringify(kycStorage));
      }
    } catch { }

    setTimeout(() => {
      this.isSavingDraft.set(false);
    }, 600);
  }

  /**
   * Nộp hồ sơ chính thức lên sàn (Chuyển sang trạng thái PENDING)
   */
  submitApplication(): Observable<{ success: boolean; message?: string }> {
    this.isSubmitting.set(true);
    this.submissionError.set(null);
    const curr = this.application();
    const payload: VendorApplicationData = {
      ...curr,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };

    // Đóng gói toàn bộ giấy tờ KYC thành chuỗi JSON để lưu trọn vẹn vào DB
    const kycDocsPayload = JSON.stringify({
      front: curr.kycInfo.idCardFrontUrl || '',
      back: curr.kycInfo.idCardBackUrl || '',
      license: curr.kycInfo.businessLicenseUrl || '',
      idNumber: curr.kycInfo.idCardNumber || '',
      logo: curr.shopInfo.logoUrl || '',
    });

    const registerReq = {
      businessName: curr.shopInfo.shopName,
      kycDocumentUrl: kycDocsPayload,
      shopName: curr.shopInfo.shopName,
      logo: curr.shopInfo.logoUrl,
      banner: null,
      description: curr.shopInfo.description,
      pickupAddress: `${curr.contactInfo.detailedAddress}, ${curr.contactInfo.ward}, ${curr.contactInfo.district}, ${curr.contactInfo.province}`,
      phone: curr.contactInfo.phone,
      email: curr.contactInfo.email,
    };

    // Lưu ảnh KYC và logo vào storage dùng chung giữa Seller và Admin
    try {
      const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
      const shopKey = (curr.shopInfo.shopName || '').trim().toLowerCase();
      const kycData = {
        front: curr.kycInfo.idCardFrontUrl || '',
        back: curr.kycInfo.idCardBackUrl || '',
        license: curr.kycInfo.businessLicenseUrl || '',
        idNumber: curr.kycInfo.idCardNumber || '',
        logo: curr.shopInfo.logoUrl || '',
        updatedAt: new Date().toISOString(),
      };
      if (shopKey) kycStorage[shopKey] = kycData;
      localStorage.setItem('vic_vendor_kyc_storage', JSON.stringify(kycStorage));
    } catch { }

    return this.http.post<any>(`${this.API}/register`, registerReq).pipe(
      delay(400),
      tap((res: any) => {
        this.application.set(payload);
        this.currentStatus.set('PENDING');

        // Đánh dấu hồ sơ bổ sung trong admin revisions là đã resubmitted
        try {
          const revs = JSON.parse(localStorage.getItem('vic_admin_vendor_revisions') || '{}');
          const vendorId = res?.data?.id;
          const shopName = curr.shopInfo.shopName?.trim().toLowerCase();
          for (const key of Object.keys(revs)) {
            if (key === String(vendorId) || key === shopName) {
              revs[key].status = 'RESUBMITTED';
              revs[key].resubmitted = true;
              revs[key].updatedAt = new Date().toISOString();
            }
          }
          localStorage.setItem('vic_admin_vendor_revisions', JSON.stringify(revs));
        } catch { }

        // Giữ lại draft với trạng thái PENDING để các màn hình khác nhận diện được
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
        localStorage.removeItem('vic_seller_products');
        window.dispatchEvent(new Event('storage'));
        this.dashboardService.syncFromOnboarding(payload);
        this.dashboardService.products.set([]);
        this.submissionError.set(null);
        this.isSubmitting.set(false);
      }),
      map(() => ({ success: true })),
      catchError((err: any) => {
        this.isSubmitting.set(false);
        const errMsg: string =
          err?.error?.message ||
          err?.error?.error ||
          (typeof err?.error === 'string' ? err.error : '') ||
          err?.message ||
          'Không thể gửi hồ sơ đăng ký. Vui lòng kiểm tra lại thông tin trùng lặp.';

        let stepToFix: number | undefined = undefined;
        let field: string | undefined = undefined;

        const lower = errMsg.toLowerCase();
        if (lower.includes('tên gian hàng') || lower.includes('tên shop') || lower.includes('shopname')) {
          stepToFix = 1;
          field = 'shopName';
        } else if (lower.includes('email')) {
          stepToFix = 2;
          field = 'email';
        } else if (lower.includes('điện thoại') || lower.includes('phone') || lower.includes('sđt')) {
          stepToFix = 2;
          field = 'phone';
        } else if (lower.includes('địa chỉ') || lower.includes('kho')) {
          stepToFix = 2;
          field = 'address';
        } else if (lower.includes('cccd') || lower.includes('ngân hàng') || lower.includes('kyc')) {
          stepToFix = 3;
          field = 'kyc';
        }

        const errorObj: SubmissionErrorInfo = { message: errMsg, field, stepToFix };
        this.submissionError.set(errorObj);
        return of({ success: false, message: errMsg });
      })
    );
  }

  /**
   * Nộp bổ sung hồ sơ theo yêu cầu của Admin: Cập nhật hồ sơ hiện có, tuyệt đối không tạo đơn đăng ký mới
   */
  submitRevision(revisionData: VendorApplicationData): Observable<{ success: boolean; message?: string }> {
    this.isSubmitting.set(true);
    this.submissionError.set(null);

    const curr = this.application();

    // 1. Giữ nguyên thông tin cũ, chỉ cập nhật các mục mới được bổ sung/sửa đổi
    const mergedShopInfo: ShopInfo = {
      ...curr.shopInfo,
      ...(revisionData.shopInfo || {}),
      shopName: (revisionData.shopInfo?.shopName || curr.shopInfo?.shopName || '').trim(),
      logoUrl: revisionData.shopInfo?.logoUrl || curr.shopInfo?.logoUrl || '',
      description: revisionData.shopInfo?.description || curr.shopInfo?.description || '',
    };

    const mergedContactInfo: ContactWarehouseInfo = {
      ...curr.contactInfo,
      ...(revisionData.contactInfo || {}),
      representativeName: revisionData.contactInfo?.representativeName || curr.contactInfo?.representativeName || '',
      phone: revisionData.contactInfo?.phone || curr.contactInfo?.phone || '',
      email: revisionData.contactInfo?.email || curr.contactInfo?.email || '',
      detailedAddress: revisionData.contactInfo?.detailedAddress || curr.contactInfo?.detailedAddress || '',
    };

    // Lấy ảnh KYC đã lưu trước đó để không bị mất ảnh cũ
    let prevKyc: any = {};
    try {
      const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
      const shopKey = mergedShopInfo.shopName.toLowerCase();
      prevKyc = kycStorage[shopKey] || kycStorage['latest_user_submission'] || {};
    } catch { }

    const mergedKycInfo: KycInfo = {
      ...curr.kycInfo,
      ...(revisionData.kycInfo || {}),
      idCardFrontUrl: revisionData.kycInfo?.idCardFrontUrl || curr.kycInfo?.idCardFrontUrl || prevKyc.front || '',
      idCardBackUrl: revisionData.kycInfo?.idCardBackUrl || curr.kycInfo?.idCardBackUrl || prevKyc.back || '',
      businessLicenseUrl: revisionData.kycInfo?.businessLicenseUrl || curr.kycInfo?.businessLicenseUrl || prevKyc.license || '',
      idCardNumber: revisionData.kycInfo?.idCardNumber || curr.kycInfo?.idCardNumber || prevKyc.idNumber || '',
    };

    // Xác định các mục vừa được người dùng bổ sung mới
    const freshItems: string[] = [];
    if (revisionData.kycInfo?.idCardFrontUrl && revisionData.kycInfo.idCardFrontUrl !== curr.kycInfo?.idCardFrontUrl) {
      freshItems.push('CCCD mặt trước');
    }
    if (revisionData.kycInfo?.idCardBackUrl && revisionData.kycInfo.idCardBackUrl !== curr.kycInfo?.idCardBackUrl) {
      freshItems.push('CCCD mặt sau');
    }
    if (revisionData.kycInfo?.businessLicenseUrl && revisionData.kycInfo.businessLicenseUrl !== curr.kycInfo?.businessLicenseUrl) {
      freshItems.push('Giấy phép kinh doanh');
    }
    if (revisionData.shopInfo?.shopName && revisionData.shopInfo.shopName !== curr.shopInfo?.shopName) {
      freshItems.push('Tên gian hàng');
    }
    if (revisionData.contactInfo?.detailedAddress && revisionData.contactInfo.detailedAddress !== curr.contactInfo?.detailedAddress) {
      freshItems.push('Địa chỉ kho');
    }
    if (freshItems.length === 0 && curr.req && curr.req.length > 0) {
      freshItems.push(...curr.req);
    }

    const payload: VendorApplicationData = {
      ...curr,
      ...revisionData,
      shopInfo: mergedShopInfo,
      contactInfo: mergedContactInfo,
      kycInfo: mergedKycInfo,
      status: 'PENDING',
      updatedAt: new Date().toISOString(),
    };

    const kycDocsPayload = JSON.stringify({
      front: mergedKycInfo.idCardFrontUrl || '',
      back: mergedKycInfo.idCardBackUrl || '',
      license: mergedKycInfo.businessLicenseUrl || '',
      idNumber: mergedKycInfo.idCardNumber || '',
      logo: mergedShopInfo.logoUrl || '',
    });

    const updateReq = {
      businessName: mergedShopInfo.shopName,
      kycDocumentUrl: kycDocsPayload,
      shopName: mergedShopInfo.shopName,
      logo: mergedShopInfo.logoUrl,
      banner: null,
      description: mergedShopInfo.description,
      pickupAddress: `${mergedContactInfo.detailedAddress}, ${mergedContactInfo.ward || ''}, ${mergedContactInfo.district || ''}, ${mergedContactInfo.province || ''}`.replace(/^,\s*|,\s*$/g, ''),
      phone: mergedContactInfo.phone,
      email: mergedContactInfo.email,
    };

    // Lưu KYC dùng chung giữa Seller và Admin
    try {
      const kycStorage = JSON.parse(localStorage.getItem('vic_vendor_kyc_storage') || '{}');
      const shopKey = mergedShopInfo.shopName.toLowerCase();
      const kycData = {
        front: mergedKycInfo.idCardFrontUrl || '',
        back: mergedKycInfo.idCardBackUrl || '',
        license: mergedKycInfo.businessLicenseUrl || '',
        idNumber: mergedKycInfo.idCardNumber || '',
        logo: mergedShopInfo.logoUrl || '',
        updatedAt: new Date().toISOString(),
      };
      if (shopKey) kycStorage[shopKey] = kycData;
      kycStorage['latest_user_submission'] = kycData;
      localStorage.setItem('vic_vendor_kyc_storage', JSON.stringify(kycStorage));
    } catch { }

    // Cập nhật trạng thái resubmitted trong admin revisions
    try {
      const revs = JSON.parse(localStorage.getItem('vic_admin_vendor_revisions') || '{}');
      const shopName = mergedShopInfo.shopName?.trim().toLowerCase();
      for (const key of Object.keys(revs)) {
        if (key === shopName || key.includes(shopName) || shopName.includes(key)) {
          revs[key].status = 'RESUBMITTED';
          revs[key].resubmitted = true;
          revs[key].updatedAt = new Date().toISOString();
        }
      }
      localStorage.setItem('vic_admin_vendor_revisions', JSON.stringify(revs));
    } catch { }

    // Cập nhật trực tiếp dữ liệu của Vendor trong danh sách duyệt của Admin (không tạo đơn mới)
    try {
      const rawApps = localStorage.getItem('vic_admin_vendor_applications_v2');
      if (rawApps) {
        const apps: any[] = JSON.parse(rawApps);
        const shopKey = (mergedShopInfo.shopName || '').trim().toLowerCase();
        // Tìm hồ sơ đăng ký của người dùng trong danh sách Admin:
        // Ưu tiên trùng tên shop, hoặc cờ isUserSubmitted, hoặc hồ sơ đang ở trạng thái chờ bổ sung (NEED_INFO / RESUBMITTED)
        let app = apps.find((a) => shopKey && a.shop?.trim().toLowerCase() === shopKey);
        if (!app) {
          app = apps.find((a) => a.isUserSubmitted);
        }
        if (!app) {
          app = apps.find((a) => a.status === 'NEED_INFO' || a.status === 'RESUBMITTED');
        }
        if (app) {
          app.status = 'RESUBMITTED';
          app.fresh = [...freshItems];
          app.isUserSubmitted = true;
          if (app.shop && !app.shop.trim() && mergedShopInfo.shopName) {
            app.shop = mergedShopInfo.shopName;
          }
          if (mergedShopInfo.logoUrl) {
            app.logo = mergedShopInfo.logoUrl;
          }

          if (!app.docItems || app.docItems.length === 0) {
            app.docItems = (app.docs || ['CCCD mặt trước', 'CCCD mặt sau']).map((name: string) => ({ name }));
          }

          app.docItems = app.docItems.map((d: any) => {
            if (d.name === 'CCCD mặt trước' && mergedKycInfo.idCardFrontUrl) {
              return { ...d, url: mergedKycInfo.idCardFrontUrl, isNew: freshItems.includes('CCCD mặt trước') };
            }
            if (d.name === 'CCCD mặt sau' && mergedKycInfo.idCardBackUrl) {
              return { ...d, url: mergedKycInfo.idCardBackUrl, isNew: freshItems.includes('CCCD mặt sau') };
            }
            if (d.name === 'Giấy phép kinh doanh' && mergedKycInfo.businessLicenseUrl) {
              return { ...d, url: mergedKycInfo.businessLicenseUrl, isNew: true };
            }
            return d;
          });

          if (mergedKycInfo.businessLicenseUrl && !app.docItems.some((d: any) => d.name === 'Giấy phép kinh doanh')) {
            app.docItems.push({
              name: 'Giấy phép kinh doanh',
              url: mergedKycInfo.businessLicenseUrl,
              isNew: true,
            });
            if (!app.docs.includes('Giấy phép kinh doanh')) {
              app.docs.push('Giấy phép kinh doanh');
            }
          }

          (app.h = app.h || []).push({
            t: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toTimeString().slice(0, 5),
            x: `Vendor đã bổ sung: ${freshItems.join(', ') || 'giấy tờ theo yêu cầu'}`,
          });
          localStorage.setItem('vic_admin_vendor_applications_v2', JSON.stringify(apps));
        }
      }
    } catch { }

    // Lưu vào draft local của seller
    this.application.set(payload);
    this.currentStatus.set('PENDING');
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
    window.dispatchEvent(new Event('storage'));

    // Gọi API cập nhật lên backend: ưu tiên PUT /resubmit, fallback POST /register
    return this.http.put<any>(`${this.API}/resubmit`, updateReq).pipe(
      catchError(() => this.http.post<any>(`${this.API}/register`, updateReq)),
      delay(300),
      tap((res: any) => {
        const vendorId = res?.data?.id;
        if (vendorId) {
          try {
            const revs = JSON.parse(localStorage.getItem('vic_admin_vendor_revisions') || '{}');
            if (revs[String(vendorId)]) {
              revs[String(vendorId)].status = 'RESUBMITTED';
              revs[String(vendorId)].resubmitted = true;
              localStorage.setItem('vic_admin_vendor_revisions', JSON.stringify(revs));
            }
          } catch { }
        }
        window.dispatchEvent(new Event('storage'));
        this.isSubmitting.set(false);
      }),
      map(() => ({ success: true })),
      catchError((err: any) => {
        this.isSubmitting.set(false);
        window.dispatchEvent(new Event('storage'));
        return of({ success: true });
      })
    );
  }

  /**
   * Äáº·t tráº¡ng thÃ¡i thá»­ nghiá»‡m cho demo/kiá»ƒm thá»­ (DRAFT, PENDING, REVISION_NEEDED, APPROVED, REJECTED)
   */
  setDemoStatus(status: ApplicationStatus, feedback?: string): void {
    const updated: VendorApplicationData = {
      ...this.application(),
      status,
      adminFeedback: feedback || (status === 'REVISION_NEEDED' ? 'áº¢nh máº·t sau CCCD bá»‹ lÃ³a Ã¡nh sÃ¡ng, vui lÃ²ng táº£i láº¡i áº£nh rÃµ nÃ©t.' : ''),
    };
    this.application.set(updated);
    this.currentStatus.set(status);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updated));
  }
}


