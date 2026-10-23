import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { Shipment } from '../../models/shipper.models';

@Component({
  selector: 'app-confirm-delivery-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './confirm-delivery-dialog.component.html',
  styleUrl: './confirm-delivery-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeliveryDialogComponent {
  readonly open = input<boolean>(false);
  readonly shipment = input<Shipment | null>(null);

  readonly confirmed = output<{ id: number; collectedCod: number }>();
  readonly closed = output<void>();

  isCodConfirmed = true;

  onConfirm(): void {
    const item = this.shipment();
    if (!item) return;
    this.confirmed.emit({ id: item.id, collectedCod: item.codAmount });
  }

  onCancel(): void {
    this.closed.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
