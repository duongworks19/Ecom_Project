export type DisplayStatus = 'WAITING' | 'DELIVERING' | 'FAILED' | 'DELIVERED';

export type ResolutionAction = 'RETRY' | 'REASSIGN' | 'RETURN';

export interface ApiResponse<T> {
  success: boolean;
  code: string;
  message: string;
  field?: string | null;
  data: T;
}

export interface DispatchCounts {
  waiting: number;
  delivering: number;
  failed: number;
  delivered: number;
}

export interface DispatchShipper {
  id: number;
  fullName: string;
  workStatus: string;
  activeOrders: number;
  maxActiveOrders: number;
}

export interface DispatchSummary {
  counts: DispatchCounts;
  running: boolean;
  lastScanAt: string;
  shippers: DispatchShipper[];
}

export interface DispatchItem {
  orderId: number;
  orderCode: string;
  district: string;
  shopName: string | null;
  receiverName: string;
  receiverPhone: string;
  codAmount: number;
  displayStatus: DisplayStatus;
  shipperName: string | null;
  attemptNo: number;
  waitingNote: string | null;
}

export interface DispatchPage<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
}

export interface ShipmentEvent {
  status: string;
  note: string;
  createdAt: string;
}

export interface DispatchDetail {
  orderId: number;
  orderCode: string;
  trackingCode: string | null;
  route: string;
  displayStatus: DisplayStatus;
  item: DispatchItem;
  events: ShipmentEvent[];
}

export interface FailureResolutionRequest {
  action: ResolutionAction;
  note?: string;
}

export interface ManualAssignRequest {
  shipperId: number;
}

export interface ActionAvailability {
  canRetry: boolean;
  canReassign: boolean;
  canReturn: boolean;
  disabledReason?: string;
}
