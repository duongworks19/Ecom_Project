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
  @Input() totalCount = 96;
  @Output() selectCustomer = new EventEmitter<AdminCustomer>();
}
