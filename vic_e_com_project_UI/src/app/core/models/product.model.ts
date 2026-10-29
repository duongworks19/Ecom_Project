export type ProductCategory =
  | 'tech'
  | 'fashion'
  | 'home'
  | 'beauty'
  | 'sports'
  | 'food'
  | 'kids'
  | 'books';

export interface ProductSeller {
  name: string;
  avatar: string;
  verified: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  categoryLabel: string;
  price: number;
  // Các thông số giảm giá do admin quản lý (chỉ hiển thị khi admin kích hoạt chiến dịch sale)
  originalPrice?: number;
  discountPercent?: number;
  isSaleItem?: boolean;
  tag?: string; // Tag tùy chọn như "Tuyển chọn", "Mới về", "Chính hãng"
  rating: number;
  soldCount: number;
  image: string;
  aspectRatio: 'square' | 'portrait-standard' | 'portrait-tall';
  seller: ProductSeller;
  shopId?: number;
}
