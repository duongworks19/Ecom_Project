import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ProductService } from '../../../../core/services/product.service';

export interface FlashDealItem {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  soldPercent: number;
  soldCount: number;
}

@Component({
  selector: 'app-flash-sale',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flash-sale.component.html',
  styleUrl: './flash-sale.component.scss',
})
export class FlashSaleComponent implements OnInit, OnDestroy {
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);

  readonly hours = signal<number>(4);
  readonly minutes = signal<number>(29);
  readonly seconds = signal<number>(53);

  private timerInterval: any;

  readonly dealItems = computed<FlashDealItem[]>(() => {
    const products = this.productService.allProducts();
    if (!products || products.length === 0) {
      return [];
    }
    // Lấy tối đa 4 sản phẩm thực tế từ database để hiển thị Deal Flash Sale
    return products.slice(0, 4).map((p, idx) => {
      const discountPercent = p.discountPercent || (20 + (idx * 5) % 15);
      const originalPrice = p.originalPrice || Math.round((p.price * (1 + discountPercent / 100)) / 1000) * 1000;
      const soldCount = p.soldCount || (idx + 1) * 8;
      const soldPercent = Math.min(95, Math.max(15, soldCount * 5));
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        price: p.price,
        originalPrice: originalPrice,
        discountPercent: discountPercent,
        soldPercent: soldPercent,
        soldCount: soldCount,
      };
    });
  });

  ngOnInit() {
    // Flash Sale backend chưa được triển khai; landing dùng dữ liệu hiển thị tạm thời.
    this.timerInterval = setInterval(() => {
      let s = this.seconds() - 1;
      let m = this.minutes();
      let h = this.hours();

      if (s < 0) {
        s = 59;
        m -= 1;
        if (m < 0) {
          m = 59;
          h -= 1;
          if (h < 0) {
            h = 23;
          }
        }
      }

      this.seconds.set(s);
      this.minutes.set(m);
      this.hours.set(h);
    }, 1000);
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  formatVND(value: number): string {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  }

  goToProduct(id: string): void {
    this.router.navigate(['/product', id]);
  }
}
