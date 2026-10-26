// Based on ERD: users, shipper_profiles, orders, shipments, shipment_events, delivered_failures

export type ShipmentStatus = 'ASSIGNED' | 'PICKED_UP' | 'DELIVERING' | 'DELIVERED' | 'FAILED';

export type FailureReason =
  | 'CUSTOMER_UNREACHABLE'
  | 'WRONG_ADDRESS'
  | 'CUSTOMER_RESCHEDULED'
  | 'CUSTOMER_REJECTED'
  | 'GOODS_DAMAGED';

export interface ShipmentEvent {
  id: number;
  shipmentId: number;
  eventType: string;
  time: string;
  title: string;
  notes?: string;
}

export interface DeliveredFailure {
  id: number;
  shipmentId: number;
  failureReason: FailureReason;
  notes: string;
  reportedAt: string;
}

export interface Shipment {
  id: number;
  orderId: number;
  code: string;
  shipperId: number;
  status: ShipmentStatus;
  codAmount: number;
  vendorName: string;
  vendorPhone: string;
  vendorAddress: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  itemSummary: string;
  packageWeightKg?: number;
  createdAt: string;
  events: ShipmentEvent[];
  failureRecord?: DeliveredFailure;
}

export interface ShipperProfile {
  id: number;
  userId: number;
  fullName: string;
  shipperCode: string;
  email: string;
  phone: string;
  vehicleType: string;
  licensePlate: string;
  hubName: string;
  serviceArea: string;
  partnerCompany: string;
  joinedDate: string;
  rating: number;
  workStatus: 'AVAILABLE' | 'BUSY' | 'OFFLINE';
}

export interface ShipperKPI {
  readyToPickCount: number;
  deliveringCount: number;
  deliveredCount: number;
  failedCount: number;
  totalCollectedCod: number;
  successRate: number;
}

export interface UpdateShipperProfileRequest {
  fullName: string;
  phone: string;
  vehicleType: string;
  licensePlate: string;
  serviceArea: string;
}
