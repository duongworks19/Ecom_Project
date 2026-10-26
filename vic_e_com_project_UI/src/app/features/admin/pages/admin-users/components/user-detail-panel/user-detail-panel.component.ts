import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCustomer, UserRole } from '../../../../models/admin-users.model';

@Component({
  selector: 'vic-user-detail-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-detail-panel.component.html',
  styleUrl: './user-detail-panel.component.scss',
})
export class UserDetailPanelComponent {
  @Input() customer: AdminCustomer | null = null;
  @Output() requestStatusToggle = new EventEmitter<AdminCustomer>();
  @Output() viewOrders = new EventEmitter<AdminCustomer>();
  @Output() viewReviews = new EventEmitter<AdminCustomer>();
  @Output() requestDelete = new EventEmitter<AdminCustomer>();

  getRoleLabel(role: UserRole | string | undefined): string {
    switch (role) {
      case 'ADMIN':
        return 'Quản trị viên';
      case 'VENDOR':
        return 'Vendor';
      case 'SHIPPER':
        return 'Shipper';
      default:
        return 'Khách hàng';
    }
  }

  getRoleBadgeClass(role: UserRole | string | undefined): string {
    switch (role) {
      case 'ADMIN':
        return 'badge-admin';
      case 'VENDOR':
        return 'badge-vendor';
      case 'SHIPPER':
        return 'badge-shipper';
      default:
        return 'badge-customer';
    }
  }
}
