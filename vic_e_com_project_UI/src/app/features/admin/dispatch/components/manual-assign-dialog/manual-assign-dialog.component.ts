import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DispatchDetail, DispatchShipper } from '../../models/dispatch.models';

@Component({
  selector: 'vic-manual-assign-dialog',
  standalone: true,
  templateUrl: './manual-assign-dialog.component.html',
  styleUrl: './manual-assign-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualAssignDialogComponent {
  readonly detail = input<DispatchDetail | null>(null);
  readonly shippers = input<DispatchShipper[]>([]);
  readonly loading = input<boolean>(false);
  readonly assign = output<number>();

  readonly dialogRef = viewChild<ElementRef<HTMLDialogElement>>('dialogRef');
  readonly selectedShipperId = signal<number | null>(null);

  readonly availableShippers = computed(() => {
    return this.shippers().filter(
      (s) => s.workStatus === 'AVAILABLE' && s.activeOrders < s.maxActiveOrders
    );
  });

  open(): void {
    this.selectedShipperId.set(null);
    this.dialogRef()?.nativeElement.showModal();
  }

  close(): void {
    this.dialogRef()?.nativeElement.close();
  }

  selectShipper(id: number): void {
    this.selectedShipperId.set(id);
  }

  confirm(): void {
    const id = this.selectedShipperId();
    if (id && !this.loading()) {
      this.assign.emit(id);
      this.close();
    }
  }
}
