export type ShipperWorkStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';
export type ShipperAccountStatus = 'ACTIVE' | 'LOCKED';
export type ShipperFilterStatus = 'ALL' | 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'LOCKED';
export type VehicleType = 'Xe máy' | 'Xe đạp điện' | 'Xe tải nhỏ';

export interface ShipperListItem {
  id: number;
  fullName: string;
  phone: string;
  workStatus: ShipperWorkStatus;
  accountStatus: ShipperAccountStatus;
  deliveringCount: number;
  serviceArea: string;
}

export interface ShipperSummary {
  total: number;
  available: number;
  busy: number;
  locked: number;
  deliveringOrders: number;
}

export interface ShipperPerformance {
  deliveredCount: number;
  failedCount: number;
  successRate: number;
}

export interface ShipperDeliveryItem {
  orderCode: string;
  status: 'DELIVERED' | 'FAILED' | 'DELIVERING';
  time: string;
}

export interface ShipperDetail extends ShipperListItem {
  email: string;
  vehicleType: VehicleType;
  licensePlate: string;
  createdAt: string;
  lockReason?: string;
  performance: ShipperPerformance;
  recentDeliveries: ShipperDeliveryItem[];
}

export interface CreateShipperRequest {
  fullName: string;
  phone: string;
  email: string;
  vehicleType: VehicleType;
  licensePlate: string;
  serviceArea: string;
  sendTempPasswordByEmail: boolean;
}

export interface UpdateShipperRequest {
  fullName: string;
  phone: string;
  vehicleType: VehicleType;
  licensePlate: string;
  serviceArea: string;
  workStatus: ShipperWorkStatus;
}

export interface ShipperQueryParams {
  keyword?: string;
  status?: ShipperFilterStatus | string;
  page?: number;
  size?: number;
}

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

/**
 * Che giữa số điện thoại theo chuẩn thiết kế: "0903123456" -> "0903 *** 456"
 */
export function maskPhoneNumber(phone: string): string {
  const digits = phone.replace(/\s+/g, '');
  if (digits.includes('***')) return phone;
  if (digits.length >= 10) {
    return `${digits.slice(0, 4)} *** ${digits.slice(-3)}`;
  }
  return phone;
}

/**
 * Lấy chữ cái đầu tên riêng (ví dụ "Vũ Thanh Tùng" -> "V" hoặc chữ cái đầu họ tên theo thiết kế)
 */
export function getShipperInitial(fullName: string): string {
  const trimmed = fullName.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'S';
}
