import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { FailureReason, Shipment } from '../../models/shipper.models';

@Component({
  selector: 'app-report-failure-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './report-failure-dialog.component.html',
  styleUrl: './report-failure-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportFailureDialogComponent {
  readonly open = input<boolean>(false);
  readonly shipment = input<Shipment | null>(null);

  readonly reported = output<{ id: number; reason: FailureReason; notes: string }>();
  readonly closed = output<void>();

  selectedReason: FailureReason = 'CUSTOMER_UNREACHABLE';
  notes = '';

  onReport(): void {
    const item = this.shipment();
    if (!item) return;
    this.reported.emit({
      id: item.id,
      reason: this.selectedReason,
      notes: this.notes.trim() || 'Khách không nhận đơn',
    });
    this.notes = '';
  }

  onCancel(): void {
    this.notes = '';
    this.closed.emit();
  }
}
