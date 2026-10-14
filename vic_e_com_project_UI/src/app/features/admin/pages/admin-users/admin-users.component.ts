import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminUsersService } from '../../services/admin-users.service';
import {
  AdminCustomer,
  AdminUsersOverview,
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

  private currentKeyword = '';
  private currentStatus = 'ALL';

  ngOnInit(): void {
    this.loadOverview(true);
  }

  onFilterChanged(filter: { keyword: string; status: string }): void {
    this.currentKeyword = filter.keyword;
    this.currentStatus = filter.status;
    this.loadOverview(false);
  }

  onConfirmStatusChange(payload: CustomerStatusChangePayload): void {
    this.usersService.changeCustomerStatus(payload).subscribe({
      next: () => {
        this.modalTargetCustomer.set(null);
        this.loadOverview(false);
      },
    });
  }

  private loadOverview(selectDefaultLocked: boolean): void {
    this.usersService
      .getCustomersOverview(this.currentKeyword, this.currentStatus)
      .subscribe({
        next: (data) => {
          this.overviewData.set(data);
          if (selectDefaultLocked) {
            const defaultSelected =
              data.customers.find((c) => c.id === 6) ?? data.customers[0] ?? null;
            this.selectedCustomer.set(defaultSelected);
          } else {
            const curId = this.selectedCustomer()?.id;
            const updated = data.customers.find((c) => c.id === curId) ?? data.customers[0] ?? null;
            this.selectedCustomer.set(updated);
          }
        },
      });
  }
}
