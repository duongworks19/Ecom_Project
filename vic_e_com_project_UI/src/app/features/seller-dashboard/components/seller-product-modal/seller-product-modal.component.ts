import {
  ChangeDetectionStrategy, Component, EventEmitter, HostListener,
  Input, OnChanges, Output, SimpleChanges, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerCategoryOption } from '../../models/seller-dashboard.model';
import { ProductVariant, SellerProduct } from '../../services/seller-product.service';
import {
  ProductMediaItem, SellerProductMediaComponent,
} from '../seller-product-media/seller-product-media.component';
import { SellerMediaLightboxComponent } from '../seller-media-lightbox/seller-media-lightbox.component';

export interface ProductSaveEvent {
  editId: number | null;
  payload: Partial<SellerProduct>;
}

@Component({
  selector: 'app-seller-product-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SellerProductMediaComponent,
    SellerMediaLightboxComponent,
  ],
  templateUrl: './seller-product-modal.component.html',
  styleUrl: './seller-product-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProductModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() product: SellerProduct | null = null;
  @Input() categories: SellerCategoryOption[] = [];

  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<ProductSaveEvent>();

  readonly formProductName = signal<string>('');
  readonly formCategory = signal<string>('');
  readonly formCategoryId = signal<number | null>(null);
  readonly formStatus = signal<string>('VISIBLE');
  readonly formDescription = signal<string>('');
  readonly formImageUrl = signal<string>('');
  readonly formMedia = signal<ProductMediaItem[]>([]);
  readonly formVariants = signal<ProductVariant[]>([]);

  readonly selectedMediaIndex = signal<number>(0);
  readonly isMediaPreviewOpen = signal<boolean>(false);
  readonly modalError = signal<string>('');

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.initForm();
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isMediaPreviewOpen()) {
      this.isMediaPreviewOpen.set(false);
      return;
    }
    if (this.isOpen) {
      this.close.emit();
    }
  }

  initForm(): void {
    this.modalError.set('');
    this.selectedMediaIndex.set(0);
    this.isMediaPreviewOpen.set(false);

    if (this.product) {
      const p = this.product;
      this.formProductName.set(p.n);
      this.formCategory.set(p.c);
      let matchedId = p.categoryId;
      if (!matchedId && p.c) {
        const found = this.categories.find(
          (cat) => cat.name.toLowerCase() === p.c.toLowerCase()
        );
        if (found) matchedId = found.id;
      }
      this.formCategoryId.set(matchedId || null);
      this.formStatus.set(p.s);
      this.formDescription.set(p.d || '');
      this.formImageUrl.set(p.imageUrl || '');

      const initialMedia: ProductMediaItem[] =
        p.media && p.media.length > 0
          ? structuredClone(p.media)
            .map((m, idx) => ({
              url: m.url,
              type: (m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE') as 'IMAGE' | 'VIDEO',
              sortOrder: m.sortOrder ?? idx,
            }))
            .sort((a, b) => a.sortOrder - b.sortOrder)
          : (p.imageUrl ? [{ url: p.imageUrl, type: 'IMAGE' as const, sortOrder: 0 }] : []);
      this.formMedia.set(initialMedia);
      this.formVariants.set(
        p.v && p.v.length > 0
          ? structuredClone(p.v)
          : [{ sku: 'SKU-' + p.id, a: 'Mặc định', p: 100000, q: 10, l: 5 }]
      );
    } else {
      this.formProductName.set('');
      const firstCat = this.categories[0];
      this.formCategory.set(firstCat ? firstCat.name : '');
      this.formCategoryId.set(firstCat ? firstCat.id : null);
      this.formStatus.set('VISIBLE');
      this.formDescription.set('');
      this.formImageUrl.set('');
      this.formMedia.set([]);
      this.formVariants.set([
        { sku: 'SP-' + Math.floor(1000 + Math.random() * 9000), a: 'Tiêu chuẩn', p: 199000, q: 20, l: 5 },
      ]);
    }
  }

  onCategoryChange(catId: number | null): void {
    this.formCategoryId.set(catId);
    if (!catId) {
      this.formCategory.set('');
      return;
    }
    const found = this.categories.find((c) => c.id === catId);
    if (found) {
      this.formCategory.set(found.name);
    }
  }

  addVariantRow(): void {
    this.formVariants.update((list) => [
      ...list,
      { sku: 'SKU-' + Math.floor(1000 + Math.random() * 9000), a: '', p: 150000, q: 10, l: 5 },
    ]);
  }

  removeVariantRow(idx: number): void {
    this.formVariants.update((list) => list.filter((_, i) => i !== idx));
  }

  openPreview(index: number): void {
    if (this.formMedia().length === 0 && this.formImageUrl().trim()) {
      this.formMedia.set([{ url: this.formImageUrl().trim(), type: 'IMAGE', sortOrder: 0 }]);
    }
    this.selectedMediaIndex.set(index);
    this.isMediaPreviewOpen.set(true);
  }

  submit(): void {
    const name = this.formProductName().trim();
    if (name.length < 3) {
      this.modalError.set('Tên sản phẩm cần tối thiểu 3 ký tự.');
      return;
    }
    const variants = this.formVariants();
    if (!variants.length) {
      this.modalError.set('Cần ít nhất một biến thể.');
      return;
    }
    for (const v of variants) {
      if (!v.sku || !v.a || v.p <= 0 || v.q < 0 || v.l < 0) {
        this.modalError.set('Mỗi biến thể cần đầy đủ SKU, phân loại, giá > 0, tồn kho và ngưỡng ≥ 0.');
        return;
      }
    }

    const img = this.formImageUrl().trim();
    const media = this.formMedia();
    const payload: Partial<SellerProduct> = {
      n: name,
      c: this.formCategory(),
      categoryId: this.formCategoryId() || undefined,
      d: this.formDescription().trim(),
      s: this.formStatus() as any,
      imageUrl: media.length > 0 ? media[0].url : (img || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80'),
      v: variants,
      media: media.length > 0 ? media : (img ? [{ url: img, type: 'IMAGE', sortOrder: 0 }] : []),
    };

    this.save.emit({
      editId: this.product ? this.product.id : null,
      payload,
    });
  }
}
