import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminCustomer, UserRole } from '../../../../models/admin-users.model';

@Component({
  selector: 'vic-user-delete-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-delete-modal.component.html',
  styleUrl: './user-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDeleteModalComponent implements OnChanges {
  @Input() user: AdminCustomer | null = null;
  @Input() isSubmitting = false;
  @Input() errorMessage: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirmPermanentDelete = new EventEmitter<{ user: AdminCustomer; reason: string }>();
  @Output() requestLockFirst = new EventEmitter<AdminCustomer>();

  readonly step = signal<1 | 2>(1);
  reason = '';
  confirmText = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['user'] && this.user) {
      this.step.set(1);
      this.reason = '';
      this.confirmText = '';
    }
  }

  getRoleLabel(role: UserRole | string | undefined): string {
    switch (role) {
      case 'ADMIN': return 'Quản trị viên';
      case 'VENDOR': return 'Vendor';
      case 'SHIPPER': return 'Shipper';
      default: return 'Khách hàng';
    }
  }

  canProceedStep1(): boolean {
    if (!this.user) return false;
    const isLocked = this.user.status === 'LOCKED';
    const notAdmin = this.user.role !== 'ADMIN';
    const hasReason = !!this.reason.trim() && this.reason.trim().length <= 500;
    return isLocked && notAdmin && hasReason;
  }

  isMatch(): boolean {
    if (!this.user) return false;
    const txt = this.confirmText.trim().toLowerCase();
    const email = this.user.email.trim().toLowerCase();
    const fullName = this.user.fullName.trim().toLowerCase();
    return txt === 'xóa' || txt === 'xoa' || txt === email || txt === fullName;
  }

  onLockFirst(): void {
    if (this.user) {
      this.requestLockFirst.emit(this.user);
    }
  }

  onConfirmFinal(): void {
    if (!this.isMatch() || this.isSubmitting || !this.user || !this.reason.trim()) {
      return;
    }
    this.confirmPermanentDelete.emit({
      user: this.user,
      reason: this.reason.trim(),
    });
  }

  onClose(): void {
    this.step.set(1);
    this.reason = '';
    this.confirmText = '';
    this.close.emit();
  }

  onBackdropClick(): void {
    if (!this.isSubmitting) {
      this.onClose();
    }
  }
}
