import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminCustomer } from '../../../../models/admin-users.model';

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
}
