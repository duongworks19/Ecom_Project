import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CustomerOrder } from '../../data-access/orders.models';
import { DialogComponent } from '../../../../../shared/ui/dialog/dialog.component';
import { FormFieldComponent } from '../../../../../shared/ui/form-field/form-field.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-cancel-order-dialog',
  standalone: true,
  imports: [ReactiveFormsModule, DialogComponent, FormFieldComponent, ButtonComponent],
  templateUrl: './cancel-order-dialog.component.html',
  styleUrl: './cancel-order-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CancelOrderDialogComponent {
  private readonly fb = inject(FormBuilder);

  readonly open = input<boolean>(false);
  readonly order = input<CustomerOrder | null>(null);
  readonly loading = input<boolean>(false);
  readonly serverError = input<string | null>(null);

  readonly confirmed = output<string>();
  readonly cancelled = output<void>();

  readonly form = this.fb.nonNullable.group({
    reason: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(300)]],
  });

  constructor() {
    effect(() => {
      if (this.open()) {
        this.form.reset({ reason: '' });
      }
    });
  }

  get reasonError(): string | null {
    const ctrl = this.form.controls.reason;
    if (!ctrl.touched && !ctrl.dirty) {
      return null;
    }
    if (ctrl.hasError('required')) {
      return 'Vui lòng nhập lý do hủy đơn.';
    }
    if (ctrl.hasError('minlength')) {
      return 'Lý do hủy đơn tối thiểu 5 ký tự.';
    }
    if (ctrl.hasError('maxlength')) {
      return 'Lý do hủy đơn không vượt quá 300 ký tự.';
    }
    return null;
  }

  onSubmit(): void {
    const trimmed = this.form.controls.reason.value.trim();
    this.form.controls.reason.setValue(trimmed);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.confirmed.emit(trimmed);
  }

  onClose(): void {
    if (!this.loading()) {
      this.cancelled.emit();
    }
  }
}
