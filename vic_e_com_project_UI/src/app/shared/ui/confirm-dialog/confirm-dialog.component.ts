import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DialogComponent } from '../dialog/dialog.component';
import { ButtonComponent, ButtonVariant } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [DialogComponent, ButtonComponent],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  readonly open = input<boolean>(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input<string>('Xác nhận');
  readonly cancelLabel = input<string>('Hủy');
  readonly confirmVariant = input<ButtonVariant>('primary');
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void {
    if (!this.loading()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.loading()) {
      this.cancelled.emit();
    }
  }
}
