import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCustomer, CustomerStatusChangePayload } from '../../../../models/admin-users.model';

@Component({
  selector: 'vic-user-status-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-status-modal.component.html',
  styleUrl: './user-status-modal.component.scss',
})
export class UserStatusModalComponent {
  @Input() customer: AdminCustomer | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<CustomerStatusChangePayload>();

  reason = '';
  showError = false;

  onSubmit(): void {
    const cleanReason = this.reason.trim();
    if (!cleanReason || !this.customer) {
      this.showError = true;
      return;
    }
    this.confirm.emit({
      customerId: this.customer.id,
      action: this.customer.status === 'LOCKED' ? 'UNLOCK' : 'LOCK',
      reason: cleanReason,
    });
    this.reason = '';
    this.showError = false;
  }
}
