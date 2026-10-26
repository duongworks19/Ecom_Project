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
   * Táº£i dá»¯ liá»‡u ban Ä‘áº§u tá»« LocalStorage hoáº·c server
   */
  loadInitialData(): void {
    const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as VendorApplicationData;
        // Kiá»ƒm tra loáº¡i bá» dá»¯ liá»‡u test/mock cÅ© náº¿u cÃ³ (vÃ­ dá»¥ 'VIC MART' hoáº·c 'HÃ  Ná»™i' hardcode)
        const isLegacyMock =
          !parsed ||
          parsed.shopInfo?.shopName?.trim().toLowerCase() === 'vic mart' ||
          (parsed.shopInfo?.businessType === 'INDIVIDUAL' && parsed.contactInfo?.province === 'HÃ  Ná»™i' && parsed.contactInfo?.ward === 'PhÆ°á»ng Dá»‹ch Vá»ng Háº­u');

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

    // Náº¿u Ä‘Ã£ Ä‘Äƒng nháº­p, thá»­ load tá»« server
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
   * Kiá»ƒm tra trÃ¹ng tÃªn shop & tá»« nháº¡y cáº£m realtime
   */
  checkShopNameAvailable(name: string): Observable<CheckShopNameResponse> {
    const raw = (name || '').trim();
    if (!raw || raw.length < 3) {
      return of({ isAvailable: false, message: 'TÃªn gian hÃ ng pháº£i tá»« 3 kÃ½ tá»± trá»Ÿ lÃªn' });
    }
    if (raw.length > 50) {
      return of({ isAvailable: false, message: 'TÃªn gian hÃ ng khÃ´ng Ä‘Æ°á»£c vÆ°á»£t quÃ¡ 50 kÃ½ tá»±' });
    }

    // Kiá»ƒm tra nhanh phÃ­a client cÃ¡c tá»« ngá»¯ cáº¥m / nháº¡y cáº£m / tÃªn sÃ n
    const clientCheck = this.validateSensitiveAndReservedLocal(raw);
    if (!clientCheck.isAvailable) {
      return of(clientCheck);
    }

    return this.http.get<any>(`${this.API}/check-name?name=${encodeURIComponent(raw)}`).pipe(
      map((res: any) => {
        const data = res?.data || res;
        return {
          isAvailable: data?.isAvailable ?? false,
          message: data?.message || (data?.isAvailable ? 'TÃªn gian hÃ ng há»£p lá»‡ vÃ  kháº£ dá»¥ng' : 'TÃªn gian hÃ ng Ä‘Ã£ tá»“n táº¡i trÃªn há»‡ thá»‘ng'),
        };
      }),
      catchError(() => {
        return of({
          isAvailable: true,
          message: 'TÃªn gian hÃ ng há»£p lá»‡ vÃ  kháº£ dá»¥ng!',
    });
      })
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
      catchError(() => of({ isAvailable: true, message: 'Email hợp lệ' }))
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

    setTimeout(() => {
      this.isSavingDraft.set(false);
    }, 600);
  }

  /**
   * Ná»™p há»“ sÆ¡ chÃ­nh thá»©c lÃªn sÃ n (Chuyá»ƒn sang tráº¡ng thÃ¡i PENDING)
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
      delay(800), // Táº¡o hiá»‡u á»©ng mÆ°á»£t mÃ 
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


