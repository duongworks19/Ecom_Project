import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShipperDetail, ShipperDeliveryItem } from '../../../../models/shipper.models';

@Component({
  selector: 'vic-shipper-lock-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipper-lock-modal.component.html',
  styleUrl: './shipper-lock-modal.component.scss',
})
export class ShipperLockModalComponent {
  @Input() shipper: ShipperDetail | null = null;
  @Input() historyShipper: ShipperDetail | null = null;
  @Input() deliveries: ShipperDeliveryItem[] = [];
  @Input() errorMessage: string | null = null;
  @Input() isSubmitting = false;

  @Output() closeLock = new EventEmitter<void>();
  @Output() confirmLock = new EventEmitter<{ shipper: ShipperDetail; reason: string }>();
  @Output() closeHistory = new EventEmitter<void>();

  reason = '';

  onConfirm(): void {
    if (!this.shipper || this.isSubmitting) return;
    this.confirmLock.emit({ shipper: this.shipper, reason: this.reason.trim() });
  }
}
