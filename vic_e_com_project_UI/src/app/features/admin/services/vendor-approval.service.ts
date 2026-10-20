import { HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, delay, mergeMap, of, throwError, timer } from 'rxjs';

// The database design document does not enumerate approval_status; these values follow the existing backend enum and requested review flow.
export type VendorApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface VendorApplication {
  id: number;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessModel: string;
  category: string;
  description?: string;
  pickupAddress: string;
  taxId?: string;
  kycDocuments: { label: string; url?: string }[];
  approvalStatus: VendorApprovalStatus;
  rejectReason?: string;
  approvedBy?: string;
  submittedAt: string;
  decidedAt?: string;
}

// ponytail: client-side search/filter is for this small mock dataset; move it to the API query when data is paginated.
const INITIAL_APPLICATIONS: VendorApplication[] = [
  {
    id: 1,
    businessName: 'Lumi Home Decor',
    ownerName: 'Nguyễn Thị Lan',
    email: 'lan.lumi@gmail.com',
    phone: '0912 345 678',
    businessModel: 'Hộ kinh doanh',
    category: 'Nhà cửa & Đời sống',
    description: 'Đồ decor và đèn trang trí phong cách tối giản Bắc Âu, ship toàn quốc.',
    pickupAddress: 'Số 12 Ngõ 88 Trần Thái Tông, Cầu Giấy, Hà Nội',
    taxId: '0109876543',
    kycDocuments: [{ label: 'CCCD mặt trước' }, { label: 'CCCD mặt sau' }, { label: 'Giấy phép kinh doanh' }],
    approvalStatus: 'PENDING',
    submittedAt: '2026-10-14T09:12:00+07:00',
  },
  {
    id: 2,
    businessName: 'VC (4)',
    ownerName: 'Trần Minh Quân',
    email: 'quan.vc@gmail.com',
    phone: '0987 111 222',
    businessModel: 'Cá nhân',
    category: 'Thể thao & Dã ngoại',
    pickupAddress: '45 Nguyễn Chí Thanh, Đống Đa, Hà Nội',
    kycDocuments: [{ label: 'CCCD mặt trước' }, { label: 'CCCD mặt sau' }],
    approvalStatus: 'PENDING',
    submittedAt: '2026-10-14T08:40:00+07:00',
  },
  {
    id: 3,
    businessName: 'Mộc Mơ Kitchen',
    ownerName: 'Phạm Thu Hà',
    email: 'ha.mocmo@gmail.com',
    phone: '0903 456 789',
    businessModel: 'Doanh nghiệp',
    category: 'Thực phẩm & Đồ uống',
    description: 'Mứt, trà và bánh thủ công làm từ nguyên liệu địa phương.',
    pickupAddress: 'Lô 5 KCN Quang Minh, Mê Linh, Hà Nội',
    taxId: '0108123456',
    kycDocuments: [{ label: 'CCCD người đại diện' }, { label: 'Giấy ĐKKD' }, { label: 'Giấy ATTP' }],
    approvalStatus: 'PENDING',
    submittedAt: '2026-10-13T16:25:00+07:00',
  },
  {
    id: 4,
    businessName: 'Pixel Gear VN',
    ownerName: 'Lê Hoàng Nam',
    email: 'nam.pixel@gmail.com',
    phone: '0966 777 888',
    businessModel: 'Hộ kinh doanh',
    category: 'Điện thoại & Đồ công nghệ',
    description: 'Phụ kiện điện thoại và gaming gear chính hãng.',
    pickupAddress: 'Số 3 Duy Tân, Cầu Giấy, Hà Nội',
    taxId: '0107654321',
    kycDocuments: [{ label: 'CCCD mặt trước' }, { label: 'CCCD mặt sau' }, { label: 'Giấy phép kinh doanh' }],
    approvalStatus: 'APPROVED',
    approvedBy: 'namnguyen20012005@gmail.com',
    submittedAt: '2026-10-12T11:03:00+07:00',
    decidedAt: '2026-10-12T14:30:00+07:00',
  },
  {
    id: 5,
    businessName: 'Bé Yêu Store',
    ownerName: 'Võ Thanh Mai',
    email: 'mai.beyeu@gmail.com',
    phone: '0933 222 111',
    businessModel: 'Cá nhân',
    category: 'Mẹ & Bé',
    description: 'Quần áo sơ sinh cotton hữu cơ.',
    pickupAddress: '18 Hoàng Quốc Việt, Cầu Giấy, Hà Nội',
    kycDocuments: [{ label: 'CCCD mặt trước' }],
    approvalStatus: 'REJECTED',
    rejectReason: 'CCCD mặt sau bị thiếu và ảnh mặt trước bị mờ. Vui lòng tải lại đủ hai mặt.',
    submittedAt: '2026-10-11T19:45:00+07:00',
    decidedAt: '2026-10-12T09:05:00+07:00',
  },
];

@Injectable({ providedIn: 'root' })
export class VendorApprovalService {
  private readonly applications = structuredClone(INITIAL_APPLICATIONS);

  // REST contract for replacing this mock: GET /api/admin/vendors?status=&q=, GET /:id, PATCH /:id/approve, PATCH /:id/reject.

  getVendors(params: { status?: VendorApprovalStatus | 'ALL'; q?: string } = {}): Observable<VendorApplication[]> {
    const q = (params.q ?? '').trim().toLocaleLowerCase('vi');
    const phoneQuery = q.replace(/\s+/g, '');
    const vendors = this.applications.filter((vendor) => {
      const matchesStatus = !params.status || params.status === 'ALL' || vendor.approvalStatus === params.status;
      const searchable = [vendor.businessName, vendor.ownerName, vendor.email].join(' ').toLocaleLowerCase('vi');
      return matchesStatus && (!q || searchable.includes(q) || vendor.phone.replace(/\s+/g, '').includes(phoneQuery));
    });
    return of(structuredClone(vendors)).pipe(delay(300));
  }

  getVendor(id: number): Observable<VendorApplication> {
    const vendor = this.applications.find((item) => item.id === id);
    return vendor ? of(structuredClone(vendor)).pipe(delay(300)) : this.fail(404, 'VENDOR_NOT_FOUND');
  }

  approveVendor(id: number): Observable<VendorApplication> {
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.approvalStatus !== 'PENDING') return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    Object.assign(vendor, { approvalStatus: 'APPROVED' as const, approvedBy: 'namnguyen20012005@gmail.com', decidedAt: new Date().toISOString() });
    return of(structuredClone(vendor)).pipe(delay(300));
  }

  rejectVendor(id: number, reason: string): Observable<VendorApplication> {
    const trimmedReason = reason.trim();
    const vendor = this.applications.find((item) => item.id === id);
    if (!vendor) return this.fail(404, 'VENDOR_NOT_FOUND');
    if (vendor.approvalStatus !== 'PENDING') return this.fail(409, 'VENDOR_ALREADY_DECIDED');
    if (trimmedReason.length < 10 || trimmedReason.length > 500) return this.fail(422, 'INVALID_REJECT_REASON');
    Object.assign(vendor, { approvalStatus: 'REJECTED' as const, rejectReason: trimmedReason, decidedAt: new Date().toISOString() });
    return of(structuredClone(vendor)).pipe(delay(300));
  }

  private fail(status: number, code: string): Observable<never> {
    return timer(300).pipe(mergeMap(() => throwError(() => new HttpErrorResponse({ status, error: { code } }))));
  }
}
