import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminProductItem, AdminProductResponse, AdminProductsService } from '../../services/admin-products.service';

@Component({
  selector: 'vic-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrl: './admin-products.component.scss',
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(AdminProductsService);

  readonly products = signal<AdminProductItem[]>([]);
  readonly response = signal<AdminProductResponse>({
    items: [],
    total: 0,
    page: 0,
    size: 10,
    totalPages: 0,
    summaryTotal: 0,
    summaryActive: 0,
    summaryLowStock: 0,
  });

  readonly isLoading = signal<boolean>(true);
  readonly toastMessage = signal<string | null>(null);

  keyword = '';
  selectedCategory = 'ALL';
  selectedStatus = 'ALL';
  page = 0;
  size = 10;

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.productService
      .getProducts(this.keyword, this.selectedCategory, this.selectedStatus, this.page, this.size)
      .subscribe({
        next: (res) => {
          this.response.set(res.data);
          this.products.set(res.data.items);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  onSearch(): void {
    this.page = 0;
    this.loadData();
  }

  onFilterStatus(st: string): void {
    this.selectedStatus = st;
    this.page = 0;
    this.loadData();
  }

  toggleStatus(p: AdminProductItem): void {
    this.productService.toggleStatus(p.id).subscribe({
      next: (res) => {
        p.status = res.data.status;
        this.showToast(`Đã đổi trạng thái sản phẩm "${p.name}" sang ${p.status}`);
      },
    });
  }

  deleteProduct(p: AdminProductItem): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${p.name}"?`)) return;
    this.productService.deleteProduct(p.id).subscribe({
      next: () => {
        this.showToast(`Đã xóa sản phẩm "${p.name}"`);
        this.loadData();
      },
    });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) this.toastMessage.set(null);
    }, 3500);
  }
}
