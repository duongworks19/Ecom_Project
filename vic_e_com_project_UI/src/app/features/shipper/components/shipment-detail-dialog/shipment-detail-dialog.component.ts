import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { Shipment } from '../../models/shipper.models';

@Component({
  selector: 'app-shipment-detail-dialog',
  standalone: true,
  imports: [CommonModule, DialogComponent],
  templateUrl: './shipment-detail-dialog.component.html',
  styleUrl: './shipment-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipmentDetailDialogComponent {
  readonly open = input<boolean>(false);
  readonly shipment = input<Shipment | null>(null);

  readonly closed = output<void>();

  onClose(): void {
    this.closed.emit();
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
  }
}
