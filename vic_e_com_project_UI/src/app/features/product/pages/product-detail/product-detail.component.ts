import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { CartStateService } from '../../../cart/services/cart-state.service';
import { CartApiService } from '../../../cart/services/cart-api.service';
import { WishlistStateService } from '../../../wishlist/services/wishlist-state.service';

export interface ProductVariantItem {
  variantId?: number;
  sku: string;
  label: string;
  price: number;
  stockQty: number;
  available: boolean;
}

export interface ProductMediaItem {
  id?: number;
  url: string;
  type: 'IMAGE' | 'VIDEO' | string;
  sortOrder?: number;
}

export interface ProductDetailData {
  id: number;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  media: ProductMediaItem[];
  price: number;
  stock: number;
  soldCount: number;
  shopId: number;
  shopName: string;
  ratingAvg: number;
  variants: ProductVariantItem[];
}

export interface ReviewItem {
  id: number;
  customerName: string;
  rating: number;
  comment: string;
  reviewImage?: string;
  reply?: string;
  shopName?: string;
  createdAt: string;
  helpfulCount: number;
  verifiedPurchase: boolean;
  hasVotedHelpful?: boolean;
}

export interface QuestionItem {
  id: number;
  customerName: string;
  question: string;
  answer?: string;
  shopName?: string;
  createdAt: string;
}

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, RouterLink],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly authService = inject(AuthService);
  readonly cartState = inject(CartStateService);
  readonly cartApi = inject(CartApiService);
  readonly wishlistState = inject(WishlistStateService);

  readonly isLoading = signal<boolean>(true);
  readonly product = signal<ProductDetailData | null>(null);
  readonly selectedVariantIndex = signal<number>(0);
  readonly quantity = signal<number>(1);
  readonly isAddingToCart = signal<boolean>(false);
  readonly isWishlisted = signal<boolean>(false);
  readonly selectedMediaIndex = signal<number>(0);
  readonly isLightboxOpen = signal<boolean>(false);
  readonly selectedMedia = computed<ProductMediaItem | null>(() => {
    const media = this.product()?.media || [];
    return media[this.selectedMediaIndex()] || media[0] || null;
  });
  readonly toastMessage = signal<string | null>(null);
  private toastTimer?: any;

  // Đánh giá sản phẩm
  readonly averageRating = signal<number>(5.0);
  readonly totalReviews = signal<number>(0);
  readonly ratingCounts = signal<{ [key: number]: number }>({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  readonly allReviews = signal<ReviewItem[]>([]);
  readonly activeReviewFilter = signal<'ALL' | 'IMAGE' | '5' | '4' | 'LOW'>('ALL');
  readonly visibleReviewLimit = signal<number>(5);

  // Form viết đánh giá
  readonly newReviewRating = signal<number>(5);
  readonly newReviewComment = signal<string>('');
  readonly newReviewImage = signal<string>('');
  readonly isSubmittingReview = signal<boolean>(false);

  // Hỏi đáp / Bình luận
  readonly allQuestions = signal<QuestionItem[]>([]);
  readonly newQuestionText = signal<string>('');
  readonly guestAuthorName = signal<string>('');
  readonly isSubmittingQuestion = signal<boolean>(false);

  readonly currentVariant = computed<ProductVariantItem | null>(() => {
    const p = this.product();
    if (!p || !p.variants || p.variants.length === 0) return null;
    const idx = this.selectedVariantIndex();
    return p.variants[idx] || p.variants[0];
  });

  readonly currentPrice = computed<number>(() => {
    const v = this.currentVariant();
    if (v && v.price) return v.price;
    return this.product()?.price || 0;
  });

  readonly currentStock = computed<number>(() => {
    const v = this.currentVariant();
    if (v && v.stockQty !== undefined) return v.stockQty;
    return this.product()?.stock || 0;
  });

  readonly currentSku = computed<string>(() => {
    const v = this.currentVariant();
    if (v && v.sku) return v.sku;
    return 'SP-' + (this.product()?.id || 1000);
  });

  readonly filteredReviews = computed<ReviewItem[]>(() => {
    const list = this.allReviews();
    const filter = this.activeReviewFilter();
    if (filter === 'IMAGE') return list.filter((r) => !!r.reviewImage);
    if (filter === '5') return list.filter((r) => r.rating === 5);
    if (filter === '4') return list.filter((r) => r.rating === 4);
    if (filter === 'LOW') return list.filter((r) => r.rating < 4);
    return list;
  });

  readonly displayedReviews = computed<ReviewItem[]>(() => {
    return this.filteredReviews().slice(0, this.visibleReviewLimit());
  });

  ngOnInit(): void {
    if (this.authService.isLoggedIn()) {
      this.cartState.refreshCount();
      this.wishlistState.refreshIds();
    }

    this.route.paramMap.subscribe((params) => {
      const idParam = params.get('id');
      if (idParam) {
        this.loadProduct(Number(idParam));
      }
    });
  }

  loadProduct(id: number): void {
    this.isLoading.set(true);

    // 1. Fetch live product detail from API
    this.http.get<any>(`http://localhost:9090/api/products/${id}`).subscribe({
      next: (res) => {
        const data = res?.data || res;
        if (data && data.name) {
          const variants: ProductVariantItem[] = Array.isArray(data.variants) && data.variants.length > 0
            ? data.variants.map((v: any) => ({
                variantId: v.variantId || v.id,
                sku: v.sku || 'SKU-' + id,
                label: v.label || v.variantName || 'Tiêu chuẩn',
                price: Number(v.price) || Number(data.price) || 0,
                stockQty: v.stockQty !== undefined ? Number(v.stockQty) : 10,
                available: v.available !== undefined ? v.available : true,
              }))
            : [
                {
                  variantId: 1,
                  sku: 'SP-' + id,
                  label: 'Tiêu chuẩn',
                  price: Number(data.price) || 0,
                  stockQty: data.stock !== undefined ? Number(data.stock) : 10,
                  available: true,
                },
              ];

          const pDetail: ProductDetailData = {
            id: data.id,
            name: data.name,
            category: data.category || 'Thể thao & Dã ngoại',
            description: data.description || 'Chất liệu cao cấp, độ bền tối ưu, thoáng khí và êm chân khi sử dụng.',
            imageUrl: data.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
            media: this.normalizeMedia(data.media, data.imageUrl),
            price: Number(data.price) || 0,
            stock: data.stock !== undefined ? Number(data.stock) : 10,
            soldCount: Number(data.soldCount) || 0,
            shopId: data.shopId || 1,
            shopName: data.shopName || 'VICMART Shop',
            ratingAvg: Number(data.ratingAvg) || 5.0,
            variants,
          };

          this.product.set(pDetail);
          this.selectedMediaIndex.set(0);
          this.isLoading.set(false);
          this.loadReviews(id);
          this.loadQuestions(id);
          this.cdr.markForCheck();
          return;
        }
        this.fallbackLoadFromLocal(id);
      },
      error: () => {
        this.fallbackLoadFromLocal(id);
      },
    });
  }

  private fallbackLoadFromLocal(id: number): void {
    // Check localStorage products saved by seller
    const saved = localStorage.getItem('vic_seller_products');
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list)) {
          const found = list.find((p: any) => p.id === id || String(p.id) === String(id));
          if (found) {
            const variants: ProductVariantItem[] = Array.isArray(found.v) && found.v.length > 0
              ? found.v.map((v: any, idx: number) => ({
                  variantId: idx + 1,
                  sku: v.sku || 'SKU-' + id,
                  label: v.a || 'Tiêu chuẩn',
                  price: Number(v.p) || 0,
                  stockQty: v.q !== undefined ? Number(v.q) : 10,
                  available: true,
                }))
              : [
                  {
                    variantId: 1,
                    sku: 'SP-' + id,
                    label: 'Tiêu chuẩn',
                    price: 199000,
                    stockQty: 10,
                    available: true,
                  },
                ];

            const pDetail: ProductDetailData = {
              id: found.id,
              name: found.n,
              category: found.c || 'Thể thao & Dã ngoại',
              description: found.d || 'Sản phẩm cao cấp được sản xuất từ chất liệu chọn lọc, đem lại trải nghiệm hoàn hảo cho người dùng.',
              imageUrl: found.imageUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
              media: this.normalizeMedia(found.media, found.imageUrl),
              price: variants[0]?.price || 199000,
              stock: variants.reduce((s, v) => s + v.stockQty, 0),
              soldCount: found.sold || 0,
              shopId: 1,
              shopName: 'VICMART Shop',
              ratingAvg: 4.8,
              variants,
            };

            this.product.set(pDetail);
            this.isLoading.set(false);
            this.loadReviews(id);
            this.loadQuestions(id);
            this.cdr.markForCheck();
            return;
          }
        }
      } catch {}
    }

    // Default fallback item if ID not in DB or storage
    const defaultVariants: ProductVariantItem[] = [
      { variantId: 1, sku: 'SP-1268', label: 'Tiêu chuẩn', price: 199000, stockQty: 10, available: true },
    ];
    this.product.set({
      id,
      name: 'giày',
      category: 'Thể thao & Dã ngoại',
      description: 'Giày thể thao êm ái, thoáng khí, đệm giày trợ lực êm ái phù hợp chạy bộ và dã ngoại.',
      imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      media: this.normalizeMedia([], 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80'),
      price: 199000,
      stock: 10,
      soldCount: 42,
      shopId: 1,
      shopName: 'VICMART Shop',
      ratingAvg: 4.6,
      variants: defaultVariants,
    });
    this.isLoading.set(false);
    this.loadReviews(id);
    this.loadQuestions(id);
    this.cdr.markForCheck();
  }

  private normalizeMedia(raw: any, fallback?: string): ProductMediaItem[] {
    const media = Array.isArray(raw) ? raw
      .filter((item: any) => item?.url)
      .map((item: any) => ({
        id: item.id,
        url: item.url,
        type: String(item.type || 'IMAGE').toUpperCase(),
        sortOrder: Number(item.sortOrder ?? 0),
      }))
      .sort((a: ProductMediaItem, b: ProductMediaItem) => (a.sortOrder || 0) - (b.sortOrder || 0)) : [];
    if (media.length === 0 && fallback) {
      return [{ url: fallback, type: 'IMAGE', sortOrder: 0 }];
    }
    return media;
  }

  selectMedia(index: number): void {
    this.selectedMediaIndex.set(index);
  }

  openLightbox(index: number = this.selectedMediaIndex()): void {
    const media = this.product()?.media || [];
    if (!media.length) return;
    this.selectedMediaIndex.set(Math.max(0, Math.min(index, media.length - 1)));
    this.isLightboxOpen.set(true);
    this.cdr.markForCheck();
  }

  closeLightbox(): void {
    this.isLightboxOpen.set(false);
  }

  moveLightbox(delta: number): void {
    const count = this.product()?.media?.length || 0;
    if (count < 2) return;
    this.selectedMediaIndex.update(index => (index + delta + count) % count);
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (this.isLightboxOpen()) {
      if (event.key === 'Escape') {
        this.closeLightbox();
      } else if (event.key === 'ArrowLeft') {
        this.moveLightbox(-1);
      } else if (event.key === 'ArrowRight') {
        this.moveLightbox(1);
      }
    }
  }

  loadReviews(productId: number): void {
    // 1. Load immediately from local product storage for zero-latency rendering
    this.loadLocalReviews(productId);

    // 2. Fetch from backend API
    this.http.get<any>(`http://localhost:9090/api/products/${productId}/reviews`).subscribe({
      next: (res) => {
        const data = res?.data;
        if (data && Array.isArray(data.reviews)) {
          this.mergeApiReviews(productId, data.reviews);
        }
      },
      error: () => {},
    });
  }

  private loadLocalReviews(productId: number): void {
    const productKey = `vic_product_reviews_${productId}`;
    const saved = localStorage.getItem(productKey);
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) {
          this.calculateAndSetReviews(list);
          return;
        }
      } catch {}
    }

    // Check seller reviews for matching product
    const sellerSaved = localStorage.getItem('vic_seller_reviews');
    if (sellerSaved) {
      try {
        const list = JSON.parse(sellerSaved);
        if (Array.isArray(list) && list.length > 0) {
          const currentProdName = this.product()?.name;
          const matching = list.filter((item: any) =>
            item.productId === productId ||
            String(item.productId) === String(productId) ||
            (currentProdName && item.p === currentProdName)
          );
          if (matching.length > 0) {
            const mapped: ReviewItem[] = matching.map((item: any) => ({
              id: item.id || Date.now(),
              customerName: item.who || item.customerName || 'Khách hàng',
              rating: item.st || item.rating || 5,
              comment: item.x || item.comment || '',
              reviewImage: item.reviewImage,
              reply: item.re || item.reply,
              shopName: this.product()?.shopName || 'VICMART Shop',
              createdAt: item.createdAt || 'Gần đây',
              helpfulCount: item.helpfulCount || 0,
              verifiedPurchase: true,
            }));
            this.calculateAndSetReviews(mapped);
            localStorage.setItem(productKey, JSON.stringify(mapped));
            return;
          }
        }
      } catch {}
    }

    this.calculateAndSetReviews([]);
  }

  private mergeApiReviews(productId: number, apiList: ReviewItem[]): void {
    const productKey = `vic_product_reviews_${productId}`;
    let localList: ReviewItem[] = [];
    const saved = localStorage.getItem(productKey);
    if (saved) {
      try {
        localList = JSON.parse(saved);
      } catch {}
    }

    const apiIds = new Set(apiList.map((r) => r.id));
    const apiComments = new Set(apiList.map((r) => r.comment.trim()));
    const uncommittedLocal = localList.filter((r) => !apiIds.has(r.id) && !apiComments.has(r.comment.trim()));

    const merged = [...apiList, ...uncommittedLocal];
    this.calculateAndSetReviews(merged);
    localStorage.setItem(productKey, JSON.stringify(merged));
  }

  private calculateAndSetReviews(list: ReviewItem[]): void {
    this.allReviews.set(list);
    this.totalReviews.set(list.length);
    const counts: { [key: number]: number } = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let sum = 0;
    for (const r of list) {
      const st = r.rating || 5;
      counts[st] = (counts[st] || 0) + 1;
      sum += st;
    }
    this.ratingCounts.set(counts);
    const avg = list.length > 0 ? Math.round((sum / list.length) * 10) / 10 : 5.0;
    this.averageRating.set(avg);
    this.cdr.markForCheck();
  }

  loadQuestions(productId: number): void {
    // 1. Immediately read from localStorage so questions appear without delay
    this.loadLocalQuestions(productId);

    // 2. Fetch live questions from backend API
    this.http.get<any>(`http://localhost:9090/api/products/${productId}/questions`).subscribe({
      next: (res) => {
        const data = res?.data;
        if (Array.isArray(data)) {
          this.mergeApiQuestions(productId, data);
        }
      },
      error: () => {},
    });
  }

  private loadLocalQuestions(productId: number): void {
    const productKey = `vic_product_questions_${productId}`;
    const saved = localStorage.getItem(productKey);
    if (saved) {
      try {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.length > 0) {
          this.allQuestions.set(list);
          this.cdr.markForCheck();
          return;
        }
      } catch {}
    }

    // Check vic_seller_questions for any questions for this product
    const sellerSaved = localStorage.getItem('vic_seller_questions');
    if (sellerSaved) {
      try {
        const list = JSON.parse(sellerSaved);
        if (Array.isArray(list) && list.length > 0) {
          const currentProdName = this.product()?.name;
          const matching = list.filter((item: any) =>
            item.productId === productId ||
            String(item.productId) === String(productId) ||
            (currentProdName && item.p === currentProdName)
          );
          if (matching.length > 0) {
            const mapped: QuestionItem[] = matching.map((item: any) => ({
              id: item.id || Date.now(),
              customerName: item.who || item.customerName || 'Khách hàng',
              question: item.x || item.question || '',
              answer: item.a || item.answer,
              shopName: this.product()?.shopName || 'VICMART Shop',
              createdAt: item.createdAt || 'Gần đây',
            }));
            this.allQuestions.set(mapped);
            localStorage.setItem(productKey, JSON.stringify(mapped));
            this.cdr.markForCheck();
            return;
          }
        }
      } catch {}
    }

    this.allQuestions.set([]);
    this.cdr.markForCheck();
  }

  private mergeApiQuestions(productId: number, apiList: QuestionItem[]): void {
    const productKey = `vic_product_questions_${productId}`;
    let localList: QuestionItem[] = [];
    const saved = localStorage.getItem(productKey);
    if (saved) {
      try {
        localList = JSON.parse(saved);
      } catch {}
    }

    const apiIds = new Set(apiList.map((q) => q.id));
    const apiTexts = new Set(apiList.map((q) => q.question.trim()));
    const uncommittedLocal = localList.filter((q) => !apiIds.has(q.id) && !apiTexts.has(q.question.trim()));

    const merged = [...apiList, ...uncommittedLocal];
    this.allQuestions.set(merged);
    localStorage.setItem(productKey, JSON.stringify(merged));
    this.cdr.markForCheck();
  }

  selectVariant(idx: number): void {
    this.selectedVariantIndex.set(idx);
    this.quantity.set(1);
  }

  decreaseQty(): void {
    this.quantity.update((q) => Math.max(1, q - 1));
  }

  increaseQty(): void {
    const maxStock = this.currentStock();
    this.quantity.update((q) => (maxStock > 0 ? Math.min(maxStock, q + 1) : q + 1));
  }

  addToCart(): void {
    const p = this.product();
    if (!p) return;
    const v = this.currentVariant();
    const vId = v?.variantId || 1;
    const qty = this.quantity();

    this.isAddingToCart.set(true);
    this.cartApi.addItem({ variantId: vId, quantity: qty }).subscribe({
      next: () => {
        this.isAddingToCart.set(false);
        this.cartState.refreshCount();
        this.showToast(`Đã thêm ${qty} "${p.name}" vào giỏ hàng!`);
      },
      error: () => {
        this.isAddingToCart.set(false);
        this.cartState.count.update((c) => c + qty);
        this.showToast(`Đã thêm ${qty} "${p.name}" vào giỏ hàng!`);
      },
    });
  }

  buyNow(): void {
    const p = this.product();
    const variantId = this.currentVariant()?.variantId;
    if (!p || !variantId || this.isAddingToCart()) return;

    const qty = this.quantity();
    this.isAddingToCart.set(true);
    this.cartApi.addItem({ variantId, quantity: qty }).subscribe({
      next: () => {
        this.cartApi.getCart().subscribe({
          next: (cart) => {
            const item = cart.shops.flatMap((shop) => shop.items)
              .find((candidate) => candidate.variantId === variantId);
            this.isAddingToCart.set(false);
            this.cartState.refreshCount();
            if (item) {
              void this.router.navigate(['/checkout'], {
                queryParams: { cartItemIds: item.itemId },
              });
            } else {
              this.showToast('Không tìm thấy sản phẩm vừa thêm vào giỏ hàng.');
            }
          },
          error: () => {
            this.isAddingToCart.set(false);
            this.showToast('Không thể tải giỏ hàng để tiếp tục thanh toán.');
          },
        });
      },
      error: () => {
        this.isAddingToCart.set(false);
        this.showToast('Không thể thêm sản phẩm vào giỏ hàng.');
      },
    });
  }

  toggleWishlist(): void {
    const p = this.product();
    if (!p) return;
    const current = this.isWishlisted();
    this.isWishlisted.set(!current);
    if (!current) {
      this.showToast(`Đã lưu "${p.name}" vào danh sách yêu thích ❤️`);
    } else {
      this.showToast(`Đã bỏ lưu khỏi danh sách yêu thích.`);
    }
  }

  setReviewFilter(filter: 'ALL' | 'IMAGE' | '5' | '4' | 'LOW'): void {
    this.activeReviewFilter.set(filter);
  }

  setRatingStars(star: number): void {
    this.newReviewRating.set(star);
  }

  onReviewImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.newReviewImage.set(e.target?.result as string);
        this.cdr.markForCheck();
      };
      reader.readAsDataURL(file);
    }
  }

  removeReviewImage(): void {
    this.newReviewImage.set('');
  }

  submitReview(): void {
    const p = this.product();
    if (!p) return;

    const comment = this.newReviewComment().trim();
    if (!comment) {
      this.showToast('Vui lòng nhập nhận xét của bạn.', true);
      return;
    }

    const customerName = this.authService.isLoggedIn()
      ? (this.authService.currentUserNameSignal() || 'Khách hàng')
      : (this.guestAuthorName().trim() || 'Khách hàng');

    const tempId = Date.now();
    const created: ReviewItem = {
      id: tempId,
      customerName,
      rating: this.newReviewRating(),
      comment,
      reviewImage: this.newReviewImage() || undefined,
      createdAt: 'Vừa xong',
      helpfulCount: 0,
      verifiedPurchase: true,
      shopName: p.shopName || 'VICMART Shop',
    };

    // Apply immediately so user doesn't wait
    this.applySubmittedReview(created, p.id, p.name);

    const payload = {
      rating: this.newReviewRating(),
      comment,
      reviewImage: this.newReviewImage() || undefined,
      customerName,
      productName: p.name,
    };

    this.isSubmittingReview.set(true);
    this.http.post<any>(`http://localhost:9090/api/products/${p.id}/reviews`, payload).subscribe({
      next: (res) => {
        this.isSubmittingReview.set(false);
        if (res?.data?.id) {
          created.id = res.data.id;
          this.applySubmittedReview(created, p.id, p.name);
        }
      },
      error: () => {
        this.isSubmittingReview.set(false);
      },
    });
  }

  private applySubmittedReview(created: ReviewItem, productId: number, productName: string): void {
    const updated = [created, ...this.allReviews().filter((r) => r.id !== created.id)];
    this.calculateAndSetReviews(updated);

    // Save to product-specific reviews
    localStorage.setItem(`vic_product_reviews_${productId}`, JSON.stringify(updated));

    // Save to vic_seller_reviews
    const currentSellerReviewsRaw = localStorage.getItem('vic_seller_reviews');
    let currentSellerReviews: any[] = [];
    if (currentSellerReviewsRaw) {
      try {
        currentSellerReviews = JSON.parse(currentSellerReviewsRaw);
      } catch {}
    }
    const sellerItem = {
      id: created.id,
      productId: productId,
      p: productName,
      who: created.customerName,
      st: created.rating,
      x: created.comment,
      re: created.reply,
      createdAt: created.createdAt,
    };
    localStorage.setItem('vic_seller_reviews', JSON.stringify([sellerItem, ...currentSellerReviews.filter((x) => x.id !== created.id)]));

    this.newReviewComment.set('');
    this.newReviewImage.set('');
    this.showToast('Gửi đánh giá thành công! Cảm ơn bạn đã đóng góp ý kiến.');
    this.cdr.markForCheck();
  }

  submitQuestion(): void {
    const p = this.product();
    if (!p) return;

    const qText = this.newQuestionText().trim();
    if (!qText) {
      this.showToast('Vui lòng nhập câu hỏi của bạn.', true);
      return;
    }

    const customerName = this.authService.isLoggedIn()
      ? (this.authService.currentUserNameSignal() || 'Khách hàng')
      : (this.guestAuthorName().trim() || 'Khách hàng');

    const tempId = Date.now();
    const created: QuestionItem = {
      id: tempId,
      customerName,
      question: qText,
      shopName: p.shopName || 'VICMART Shop',
      createdAt: 'Vừa xong',
    };

    // Apply immediately so user sees their question instantly
    this.applySubmittedQuestion(created, p.id, p.name);

    const payload = {
      question: qText,
      customerName,
      productName: p.name,
    };

    this.isSubmittingQuestion.set(true);
    this.http.post<any>(`http://localhost:9090/api/products/${p.id}/questions`, payload).subscribe({
      next: (res) => {
        this.isSubmittingQuestion.set(false);
        if (res?.data?.id) {
          created.id = res.data.id;
          this.applySubmittedQuestion(created, p.id, p.name);
        }
      },
      error: () => {
        this.isSubmittingQuestion.set(false);
      },
    });
  }

  private applySubmittedQuestion(created: QuestionItem, productId: number, productName: string): void {
    // 1. Update component signal
    this.allQuestions.update((list) => {
      const filtered = list.filter((item) => item.id !== created.id);
      return [created, ...filtered];
    });

    // 2. Persist to product specific storage: vic_product_questions_${productId}
    const productKey = `vic_product_questions_${productId}`;
    let productList: QuestionItem[] = [];
    const productListRaw = localStorage.getItem(productKey);
    if (productListRaw) {
      try {
        productList = JSON.parse(productListRaw);
      } catch {}
    }
    const updatedProductList = [created, ...productList.filter((item) => item.id !== created.id)];
    localStorage.setItem(productKey, JSON.stringify(updatedProductList));

    // 3. Sync to seller dashboard storage: vic_seller_questions
    const currentQuestionsRaw = localStorage.getItem('vic_seller_questions');
    let currentQuestions: any[] = [];
    if (currentQuestionsRaw) {
      try {
        currentQuestions = JSON.parse(currentQuestionsRaw);
      } catch {}
    }
    const sellerQItem = {
      id: created.id,
      productId: productId,
      p: productName,
      who: created.customerName,
      x: created.question,
      a: created.answer,
      createdAt: created.createdAt,
    };
    const updatedSellerQuestions = [sellerQItem, ...currentQuestions.filter((item) => item.id !== created.id)];
    localStorage.setItem('vic_seller_questions', JSON.stringify(updatedSellerQuestions));

    this.newQuestionText.set('');
    this.guestAuthorName.set('');
    this.showToast('Đã gửi câu hỏi tới gian hàng! Câu hỏi của bạn đã được hiển thị công khai.');
    this.cdr.markForCheck();
  }

  voteHelpful(review: ReviewItem): void {
    if (review.hasVotedHelpful) return;
    review.helpfulCount = (review.helpfulCount || 0) + 1;
    review.hasVotedHelpful = true;
    this.allReviews.update((list) => [...list]);

    this.http.post<any>(`http://localhost:9090/api/products/reviews/${review.id}/helpful`, {}).subscribe({
      error: () => {},
    });
  }

  showMoreReviews(): void {
    this.visibleReviewLimit.update((v) => v + 5);
  }

  showToast(msg: string, isError: boolean = false): void {
    this.toastMessage.set(msg);
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastMessage.set(null), 3000);
    this.cdr.markForCheck();
  }

  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  getStarPercent(star: number): number {
    const total = this.totalReviews();
    if (total === 0) return 0;
    const count = this.ratingCounts()[star] || 0;
    return Math.round((count / total) * 100);
  }
}
