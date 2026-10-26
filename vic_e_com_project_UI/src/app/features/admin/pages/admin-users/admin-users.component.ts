import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminUsersService } from '../../services/admin-users.service';
import {
  AdminCustomer,
  AdminUsersOverview,
  CustomerOrderItemApiResponse,
  CustomerPageApiResponse,
  CustomerReviewItemApiResponse,
  CustomerStatusChangePayload,
} from '../../models/admin-users.model';
import { UsersKpiComponent } from './components/users-kpi/users-kpi.component';
import { UsersFilterBarComponent } from './components/users-filter-bar/users-filter-bar.component';
import { UsersTableComponent } from './components/users-table/users-table.component';
import { UserDetailPanelComponent } from './components/user-detail-panel/user-detail-panel.component';
import { UserStatusModalComponent } from './components/user-status-modal/user-status-modal.component';
import { UserDeleteModalComponent } from './components/user-delete-modal/user-delete-modal.component';

@Component({
  selector: 'vic-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    UsersKpiComponent,
    UsersFilterBarComponent,
    UsersTableComponent,
    UserDetailPanelComponent,
    UserStatusModalComponent,
    UserDeleteModalComponent,
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(AdminUsersService);

  readonly overviewData = signal<AdminUsersOverview | null>(null);
  readonly selectedCustomer = signal<AdminCustomer | null>(null);
  readonly modalTargetCustomer = signal<AdminCustomer | null>(null);
  readonly deleteModalUser = signal<AdminCustomer | null>(null);
  readonly deleteModalError = signal<string | null>(null);
  readonly isDeleteSubmitting = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);

  readonly ordersModalData = signal<CustomerPageApiResponse<CustomerOrderItemApiResponse> | null>(null);
  readonly reviewsModalData = signal<CustomerPageApiResponse<CustomerReviewItemApiResponse> | null>(null);

  private currentKeyword = '';
  private currentStatus = 'ALL';
  private currentPage = 0;
  private readonly pageSize = 10;

  ngOnInit(): void {
    this.loadOverview();
  }

  onFilterChanged(filter: { keyword: string; status: string }): void {
    this.currentKeyword = filter.keyword;
    this.currentStatus = filter.status;
    this.currentPage = 0;
    this.loadOverview();
  }

  onPageChanged(page: number): void {
    this.currentPage = page;
    this.loadOverview();
  }

  onSelectCustomer(customer: AdminCustomer): void {
    this.selectedCustomer.set(customer);
    this.usersService.getCustomerDetail(customer.id).subscribe({
      next: (detail) => {
        if (this.selectedCustomer()?.id === customer.id) {
          this.selectedCustomer.set(detail);
        }
      },
    });
  }

  onConfirmStatusChange(payload: CustomerStatusChangePayload): void {
    const req$ = payload.action === 'LOCK'
      ? this.usersService.lockUser(payload.customerId, payload.reason)
      : this.usersService.unlockUser(payload.customerId);

    req$.subscribe({
      next: () => {
        this.modalTargetCustomer.set(null);
        this.showToast(payload.action === 'LOCK' ? 'Đã khóa tài khoản thành công.' : 'Đã mở khóa tài khoản thành công.');
        this.loadOverview();
      },
      error: (err: HttpErrorResponse) => {
        this.showToast(err.error?.message || 'Không thể thay đổi trạng thái tài khoản.');
      },
    });
  }

  onOpenDeleteModal(user: AdminCustomer): void {
    this.deleteModalError.set(null);
    this.deleteModalUser.set(user);
  }

  onConfirmPermanentDelete(event: { user: AdminCustomer; reason: string }): void {
    this.isDeleteSubmitting.set(true);
    this.deleteModalError.set(null);

    this.usersService.permanentlyDeleteUser(event.user.id, event.reason).subscribe({
      next: () => {
        this.isDeleteSubmitting.set(false);
        this.deleteModalUser.set(null);
        this.showToast(`Đã xóa vĩnh viễn tài khoản ${event.user.fullName} và gửi email thông báo.`);
        this.selectedCustomer.set(null);
        this.loadOverview();
      },
      error: (err: HttpErrorResponse) => {
        this.isDeleteSubmitting.set(false);
        const msg = err.error?.message || (err.status === 409
          ? 'Không thể xóa: Tài khoản phải ở trạng thái ĐÃ KHÓA trước khi xóa.'
          : 'Không thể xóa tài khoản người dùng này.');
        this.deleteModalError.set(msg);
      },
    });
  }

  onRequestLockFromDeleteModal(user: AdminCustomer): void {
    this.deleteModalUser.set(null);
    this.modalTargetCustomer.set(user);
  }

  onViewOrders(customer: AdminCustomer, page = 0): void {
    this.usersService.getCustomerOrders(customer.id, page, 10).subscribe({
      next: (res) => this.ordersModalData.set(res),
    });
  }

  onViewReviews(customer: AdminCustomer, page = 0): void {
    this.usersService.getCustomerReviews(customer.id, page, 10).subscribe({
      next: (res) => this.reviewsModalData.set(res),
    });
  }

  closeSubModals(): void {
    this.ordersModalData.set(null);
    this.reviewsModalData.set(null);
  }

  private loadOverview(): void {
    this.usersService
      .getCustomersOverview(this.currentKeyword, this.currentStatus, this.currentPage, this.pageSize)
      .subscribe({
        next: (data) => {
          this.overviewData.set(data);
          const curId = this.selectedCustomer()?.id;
          const target = data.customers.find((c) => c.id === curId) ?? data.customers[0] ?? null;
          if (target) {
            this.onSelectCustomer(target);
          } else {
            this.selectedCustomer.set(null);
          }
        },
      });
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => {
      if (this.toastMessage() === msg) {
        this.toastMessage.set(null);
      }
    }, 3500);
  }
}
