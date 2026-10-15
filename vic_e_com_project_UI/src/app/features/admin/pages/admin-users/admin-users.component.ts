import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ],
  templateUrl: './admin-users.component.html',
  styleUrl: './admin-users.component.scss',
})
export class AdminUsersComponent implements OnInit {
  private usersService = inject(AdminUsersService);

  readonly overviewData = signal<AdminUsersOverview | null>(null);
  readonly selectedCustomer = signal<AdminCustomer | null>(null);
  readonly modalTargetCustomer = signal<AdminCustomer | null>(null);
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
    this.usersService.changeCustomerStatus(payload).subscribe({
      next: () => {
        this.modalTargetCustomer.set(null);
        this.loadOverview();
      },
    });
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
}
