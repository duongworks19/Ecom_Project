import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCustomer } from '../../../../models/admin-users.model';

@Component({
  selector: 'vic-users-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users-table.component.html',
  styleUrl: './users-table.component.scss',
})
export class UsersTableComponent {
  @Input() customers: AdminCustomer[] = [];
  @Input() selectedCustomerId: number | null = null;
  @Input() totalCount = 0;
  @Input() page = 0;
  @Input() size = 10;
  @Input() totalPages = 0;
  @Output() selectCustomer = new EventEmitter<AdminCustomer>();
  @Output() pageChange = new EventEmitter<number>();

  get startItem(): number {
    return this.customers.length ? this.page * this.size + 1 : 0;
  }

  get endItem(): number {
    return this.customers.length ? this.page * this.size + this.customers.length : 0;
  }

  onPrevPage(): void {
    if (this.page > 0) {
      this.pageChange.emit(this.page - 1);
    }
  }

  onNextPage(): void {
    if (this.page + 1 < this.totalPages) {
      this.pageChange.emit(this.page + 1);
    }
  }
}
