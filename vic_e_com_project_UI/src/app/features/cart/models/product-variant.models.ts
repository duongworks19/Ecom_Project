/** Biến thể sản phẩm — khớp ProductVariantDtos.Item. */
export interface ProductVariant {
  variantId: number;
  sku: string;
  label: string;
  price: number;
  stockQty: number;
  available: boolean;
}

/** Response của GET /products/{id}/variants — khớp ProductVariantDtos.Response. */
export interface ProductVariantsResponse {
  productId: number;
  variants: ProductVariant[];
}
