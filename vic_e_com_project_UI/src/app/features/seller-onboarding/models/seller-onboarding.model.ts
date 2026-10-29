export type BusinessType = 'INDIVIDUAL' | 'HOUSEHOLD' | 'COMPANY' | '';

export type ApplicationStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'PENDING'
  | 'REVISION_NEEDED'
  | 'REJECTED'
  | 'APPROVED'
  | 'SUSPENDED';

export interface ShopInfo {
  shopName: string;
  businessType: BusinessType;
  primaryCategory: string;
  description: string;
  logoUrl?: string;
}

export interface ContactWarehouseInfo {
  representativeName: string;
  phone: string;
  email: string;
  province: string;
  district: string;
  ward: string;
  detailedAddress: string;
  pickupNote?: string;
}

export interface KycInfo {
  idCardNumber: string;
  idCardFrontUrl: string;
  idCardBackUrl: string;
  businessLicenseUrl?: string;
  taxCode?: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
}

export interface VendorApplicationData {
  id?: number;
  userId?: number;
  shopInfo: ShopInfo;
  contactInfo: ContactWarehouseInfo;
  kycInfo: KycInfo;
  status: ApplicationStatus;
  adminFeedback?: string;
  req?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CheckShopNameResponse {
  isAvailable: boolean;
  message: string;
}
