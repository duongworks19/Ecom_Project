/** Một sản phẩm trong wishlist — khớp WishlistDtos.Item. */
export interface WishlistItem {
  productId: number;
  name: string;
  imageUrl: string | null;
  minPrice: number;
  hasMultipleVariants: boolean;
  ratingAvg: number;
  soldCount: number;
  available: boolean;
  defaultVariantId: number | null;
}

/** Response của GET /wishlist — khớp WishlistDtos.PageResponse. */
export interface WishlistPageResponse {
  content: WishlistItem[];
  page: number;
  size: number;
  totalElements: number;
}

/** Response của GET /wishlist/ids — khớp WishlistDtos.IdsResponse. */
export interface WishlistIdsResponse {
  productIds: number[];
}
