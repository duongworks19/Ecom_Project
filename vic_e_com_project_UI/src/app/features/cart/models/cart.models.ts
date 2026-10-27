/** Một dòng sản phẩm trong giỏ hàng — khớp CartDtos.Item. */
export interface CartItem {
  itemId: number;
  productId: number;
  productName: string;
  imageUrl: string | null;
  variantId: number;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  stockQty: number;
  lowStock: boolean;
  reason: string | null;
}

/** Nhóm shop — khớp CartDtos.ShopGroup. */
export interface CartShopGroup {
  shopId: number;
  shopName: string;
  items: CartItem[];
}

/** Response của GET /cart — khớp CartDtos.CartResponse. */
export interface CartResponse {
  shops: CartShopGroup[];
  unavailableItems: CartItem[];
  itemCount: number;
}

/** Response của GET /cart/count — khớp CartDtos.CountResponse. */
export interface CartCountResponse {
  count: number;
}

/** Body của POST /cart/items. */
export interface AddToCartRequest {
  variantId: number;
  quantity: number;
}

/** Body của PATCH /cart/items/{itemId}. */
export interface UpdateCartItemRequest {
  quantity?: number;
  variantId?: number;
}

/** Body của POST /cart/items/bulk-delete. */
export interface BulkDeleteRequest {
  itemIds: number[];
}

/** CartItem được làm giàu với lineTotal tính phía client. */
export interface CartItemWithTotal extends CartItem {
  lineTotal: number;
}
