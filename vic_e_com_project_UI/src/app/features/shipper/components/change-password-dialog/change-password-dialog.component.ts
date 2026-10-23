import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogComponent } from '../../../../shared/ui/dialog/dialog.component';
import { PasswordFormComponent } from '../../../../shared/ui/password-form/password-form.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

@Component({
  selector: 'app-change-password-dialog',
  standalone: true,
  imports: [CommonModule, DialogComponent, PasswordFormComponent],
  templateUrl: './change-password-dialog.component.html',
  styleUrl: './change-password-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangePasswordDialogComponent {
  private readonly toastService = inject(ToastService);

  readonly open = input<boolean>(false);
  readonly closed = output<void>();

  onPasswordChanged(): void {
    this.toastService.success('Đổi mật khẩu thành công!');
    this.closed.emit();
  }

  onCancel(): void {
    this.closed.emit();
  }
}
