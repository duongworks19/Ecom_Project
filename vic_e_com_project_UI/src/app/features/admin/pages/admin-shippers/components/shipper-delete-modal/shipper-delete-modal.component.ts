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
import { ShipperDetail } from '../../../../models/shipper.models';

@Component({
  selector: 'vic-shipper-delete-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipper-delete-modal.component.html',
  styleUrl: './shipper-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipperDeleteModalComponent implements OnChanges {
  @Input() shipper: ShipperDetail | null = null;
  @Input() isSubmitting = false;
  @Input() errorMessage: string | null = null;

  @Output() close = new EventEmitter<void>();
  @Output() confirmPermanentDelete = new EventEmitter<ShipperDetail>();
  @Output() requestLockFirst = new EventEmitter<ShipperDetail>();

  readonly step = signal<1 | 2>(1);
  confirmText = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['shipper'] && this.shipper) {
      this.step.set(1);
      this.confirmText = '';
    }
  }

  canProceedStep1(): boolean {
    return !!this.shipper && this.shipper.accountStatus === 'LOCKED' && this.shipper.deliveringCount === 0;
  }

  isMatch(): boolean {
    if (!this.shipper) return false;
    const txt = this.confirmText.trim().toLowerCase();
    const fullName = this.shipper.fullName.trim().toLowerCase();
    return txt === 'xóa' || txt === 'xoa' || txt === fullName;
  }

  onLockFirst(): void {
    if (this.shipper) {
      this.requestLockFirst.emit(this.shipper);
    }
  }

  onConfirmFinal(): void {
    if (!this.isMatch() || this.isSubmitting || !this.shipper) {
      return;
    }
    this.confirmPermanentDelete.emit(this.shipper);
  }

  onClose(): void {
    this.step.set(1);
    this.confirmText = '';
    this.close.emit();
  }

  onBackdropClick(): void {
    if (!this.isSubmitting) {
      this.onClose();
    }
  }
}
