import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCategoriesService, AdminCategory } from '../../services/admin-categories.service';

@Component({
  selector: 'vic-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrl: './admin-categories.component.scss',
})
export class AdminCategoriesComponent implements OnInit {
  private categoryService = inject(AdminCategoriesService);

  readonly categories = signal<AdminCategory[]>([]);
  readonly isLoading = signal<boolean>(true);
  readonly toastMessage = signal<string | null>(null);

  // New Category Modal
  showModal = false;
  newCatName = '';
  newCatIcon = '📦';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading.set(true);
    this.categoryService.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  openCreateModal(): void {
    this.newCatName = '';
    this.newCatIcon = '📦';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveCategory(): void {
    if (!this.newCatName.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }
    this.categoryService.createCategory({ name: this.newCatName.trim(), icon: this.newCatIcon }).subscribe({
      next: () => {
        this.closeModal();
        this.showToast('Tạo danh mục mới thành công');
        this.loadData();
      },
      error: (err) => alert(err.error?.message || 'Lỗi khi tạo danh mục'),
    });
  }

  deleteCategory(id: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.showToast('Đã xóa danh mục');
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
