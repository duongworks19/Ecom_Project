import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SellerProduct } from '../../models/seller-dashboard.model';
import { PRESET_DECOR_IMAGES } from '../../constants/seller-dashboard.mock';
import { ProductApiService } from '../../../../core/services/product-api.service';
import { CategoryItem } from '../../../../core/models/category.model';

export interface ProductVariantRow {
  sku: string;
  variant: string;
  price: number;
  stock: number;
  threshold: number;
}

@Component({
  selector: 'app-seller-product-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './seller-product-form.component.html',
  styleUrl: './seller-product-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerProductFormComponent implements OnInit {
  private readonly productApiService = inject(ProductApiService);
  readonly editingProduct = input<SellerProduct | null>(null);

  readonly save = output<{
    id?: number;
    name: string;
    category: string;
    status: 'ACTIVE' | 'HIDDEN';
    description: string;
    imageUrl: string;
    variant: string;
    sku: string;
    price: number;
    stock: number;
    threshold: number;
  }>();
  readonly close = output<void>();

  readonly dbCategories = signal<CategoryItem[]>([]);
  readonly categories = computed(() => this.dbCategories().map((c: CategoryItem) => c.name));

  readonly presetImages = PRESET_DECOR_IMAGES;

  formName = signal<string>('');
  formCategory = signal<string>('');
  formStatus = signal<'ACTIVE' | 'HIDDEN'>('ACTIVE');

  ngOnInit(): void {
    this.productApiService.getCategories().subscribe((items) => {
      if (items && items.length > 0) {
        this.dbCategories.set(items);
        if (!this.formCategory()) {
          this.formCategory.set(items[0].name);
        }
      }
    });
  }
  formDescription = signal<string>('');
  formImageUrl = signal<string>(PRESET_DECOR_IMAGES[0].url);
  uploadedImageFileName = signal<string | null>(null);

  variants = signal<ProductVariantRow[]>([
    {
      sku: 'LM-101',
      variant: 'Tiêu chuẩn',
      price: 250000,
      stock: 20,
      threshold: 5,
    },
  ]);

  readonly formError = signal<string | null>(null);
  readonly imageUploadError = signal<string | null>(null);

  constructor() {
    effect(
      () => {
        const p = this.editingProduct();
        if (p) {
          this.formName.set(p.name);
          this.formCategory.set(p.category || 'Nhà cửa & Đời sống');
          this.formStatus.set(p.status === 'HIDDEN' ? 'HIDDEN' : 'ACTIVE');
          this.formDescription.set('');
          this.formImageUrl.set(p.imageUrl || PRESET_DECOR_IMAGES[0].url);
          this.uploadedImageFileName.set(null);
          this.variants.set([
            {
              sku: p.sku,
              variant: p.variant,
              price: p.price,
              stock: p.stock,
              threshold: 5,
            },
          ]);
        } else {
          const rand = 100 + (Date.now() % 900);
          this.formName.set('');
          this.formCategory.set('Nhà cửa & Đời sống');
          this.formStatus.set('ACTIVE');
          this.formDescription.set('');
          this.formImageUrl.set(PRESET_DECOR_IMAGES[0].url);
          this.uploadedImageFileName.set(null);
          this.variants.set([
            {
              sku: `LM-${rand}`,
              variant: 'Tiêu chuẩn',
              price: 250000,
              stock: 20,
              threshold: 5,
            },
          ]);
        }
      },
      { allowSignalWrites: true }
    );
  }

  onImageFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!/\.(jpe?g|png|webp)$/i.test(file.name)) {
      this.imageUploadError.set('Chỉ chấp nhận file ảnh định dạng JPG, PNG hoặc WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      this.imageUploadError.set('Dung lượng ảnh tối đa là 5MB.');
      return;
    }

    this.imageUploadError.set(null);
    this.uploadedImageFileName.set(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.formImageUrl.set(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  onSelectPresetImage(url: string): void {
    this.formImageUrl.set(url);
    this.uploadedImageFileName.set(null);
    this.imageUploadError.set(null);
  }

  removeImage(): void {
    this.formImageUrl.set(PRESET_DECOR_IMAGES[0].url);
    this.uploadedImageFileName.set(null);
    this.imageUploadError.set(null);
  }

  addVariant(): void {
    const rand = 100 + (Date.now() % 900);
    this.variants.update((curr) => [
      ...curr,
      {
        sku: `LM-${rand}`,
        variant: `Phân loại ${curr.length + 1}`,
        price: 250000,
        stock: 20,
        threshold: 5,
      },
    ]);
  }

  removeVariant(index: number): void {
    if (this.variants().length <= 1) {
      this.formError.set('Cần ít nhất một biến thể.');
      return;
    }
    this.variants.update((curr) => curr.filter((_, i) => i !== index));
  }

  updateVariant(index: number, field: keyof ProductVariantRow, value: any): void {
    this.variants.update((curr) =>
      curr.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  }

  onSubmit(): void {
    const name = this.formName().trim();
    if (name.length < 3) {
      this.formError.set('Tên sản phẩm cần từ 3 ký tự trở lên.');
      return;
    }

    const vars = this.variants();
    if (!vars.length) {
      this.formError.set('Cần ít nhất một biến thể.');
      return;
    }

    for (const v of vars) {
      if (!v.sku || !v.variant || !(v.price > 0) || v.stock < 0) {
        this.formError.set('Mỗi biến thể cần SKU, phân loại, giá > 0 và tồn kho ≥ 0.');
        return;
      }
    }

    this.formError.set(null);
    const primary = vars[0];
    this.save.emit({
      id: this.editingProduct()?.id,
      name,
      category: this.formCategory(),
      status: this.formStatus(),
      description: this.formDescription(),
      imageUrl: this.formImageUrl(),
      variant: primary.variant,
      sku: primary.sku,
      price: Number(primary.price),
      stock: Number(primary.stock),
      threshold: Number(primary.threshold) || 5,
    });
  }
}
