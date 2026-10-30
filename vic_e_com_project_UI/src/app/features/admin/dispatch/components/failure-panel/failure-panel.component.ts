import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DispatchDetail, ResolutionAction } from '../../models/dispatch.models';
import {
  getFailureActionAvailability,
  getLatestFailureReason,
} from '../../utils/dispatch-helpers';

@Component({
  selector: 'vic-failure-panel',
  standalone: true,
  imports: [DatePipe, FormsModule],
  templateUrl: './failure-panel.component.html',
  styleUrl: './failure-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailurePanelComponent {
  readonly detail = input.required<DispatchDetail>();
  readonly loading = input<boolean>(false);
  readonly resolve = output<{ action: ResolutionAction; note?: string }>();

  readonly returnDialog = viewChild<ElementRef<HTMLDialogElement>>('returnDialog');
  returnNote = '';

  readonly availability = computed(() => {
    const orderStatus = this.detail().item.orderStatus;
    if (orderStatus === 'CANCELLED' || orderStatus === 'REJECTED') {
      return {
        canRetry: false,
        canReassign: false,
        canReturn: false,
        disabledReason: 'Đơn hàng đã kết thúc, không thể xử lý lại.',
      };
    }
    return getFailureActionAvailability(this.detail().item.attemptNo, 3);
  });

  readonly failureReason = computed(() => {
    return getLatestFailureReason(this.detail().events);
  });

  readonly latestFailureTime = computed(() => {
    const failedEvents = (this.detail().events || []).filter(
      (e) => e.status === 'FAILED'
    );
    if (failedEvents.length > 0) {
      return failedEvents[failedEvents.length - 1].createdAt;
    }
    return null;
  });

  onAction(action: ResolutionAction): void {
    const allowed = {
      RETRY: this.availability().canRetry,
      REASSIGN: this.availability().canReassign,
      RETURN: this.availability().canReturn,
    }[action];
    if (this.loading() || !allowed) return;

    if (action === 'RETURN') {
      this.returnNote = '';
      this.returnDialog()?.nativeElement.showModal();
    } else {
      this.resolve.emit({ action });
    }
  }

  closeReturnDialog(): void {
    this.returnDialog()?.nativeElement.close();
  }

  confirmReturn(): void {
    if (this.loading() || !this.availability().canReturn) return;
    this.resolve.emit({
      action: 'RETURN',
      note: this.returnNote.trim() || undefined,
    });
    this.closeReturnDialog();
  }
}
