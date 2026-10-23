import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

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
  readonly hours = signal<number>(4);
  readonly minutes = signal<number>(29);
  readonly seconds = signal<number>(53);

  private timerInterval: any;

  readonly dealItems = signal<FlashDealItem[]>([
    {
      id: 'fd-1',
      name: 'Tai Nghe Chống Ồn Flagship Hi-Res Audio Không Dây',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
      price: 6890000,
      originalPrice: 8990000,
      discountPercent: 23,
      soldPercent: 82,
      soldCount: 389,
    },
    {
      id: 'fd-2',
      name: 'Áo Khoác Trench Coat Dáng Rộng Tối Giản Thời Thượng',
      image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80',
      price: 1450000,
      originalPrice: 2200000,
      discountPercent: 34,
      soldPercent: 68,
      soldCount: 245,
    },
    {
      id: 'fd-3',
      name: 'Máy Pha Cà Phê Espresso Thủ Công Áp Suất 15 Bar',
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
      price: 4990000,
      originalPrice: 6500000,
      discountPercent: 23,
      soldPercent: 91,
      soldCount: 512,
    },
    {
      id: 'fd-4',
      name: 'Nước Hoa Niche Cao Cấp Santal Wood EDP 100ml',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80',
      price: 2490000,
      originalPrice: 3500000,
      discountPercent: 29,
      soldPercent: 74,
      soldCount: 318,
    },
  ]);

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
}
