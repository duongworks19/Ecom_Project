export interface CheckoutVoucherInput {
  shopId: number;
  code: string;
}

export interface CheckoutRequest {
  cartItemIds: number[];
  addressId: number;
  vouchers: CheckoutVoucherInput[];
  paymentMethod: string;
}

export interface CheckoutItem {
  cartItemId: number;
  variantId: number;
  productName: string;
  variantInfo: string | null;
  thumbnailUrl: string | null;
  unitPrice: number;
  originalPrice: number | null;
  quantity: number;
  lineTotal: number;
}

export interface CheckoutShopPreview {
  shopId: number;
  shopName: string;
  items: CheckoutItem[];
  subtotal: number;
  shippingFee: number;
  voucherCode: string | null;
  discountAmount: number;
  total: number;
}

export interface CheckoutPreviewResponse {
  shops: CheckoutShopPreview[];
  grandTotal: number;
}

export interface PlacedOrder {
  id: number;
  orderCode: string;
  shopName: string;
  total: number;
}

export interface PlaceOrderResponse {
  checkoutGroupId: number;
  orders: PlacedOrder[];
  grandTotal: number;
}

export interface CheckoutErrorBody {
  status?: number;
  code?: string;
  message?: string;
  field?: string | null;
  success?: boolean;
}

export const MAX_CART_ITEMS = 100;

export const VOUCHER_ERROR_CODES = new Set([
  'INVALID_VOUCHER',
  'VOUCHER_MINIMUM_NOT_MET',
  'MULTIPLE_VOUCHERS',
]);

