import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  DispatchDetail,
  DispatchShipper,
  ResolutionAction,
} from '../../models/dispatch.models';
import { getStatusBadge } from '../../utils/dispatch-helpers';
import { FailurePanelComponent } from '../failure-panel/failure-panel.component';
import { WaitingPanelComponent } from '../waiting-panel/waiting-panel.component';
import { ManualAssignDialogComponent } from '../manual-assign-dialog/manual-assign-dialog.component';
import { InfoRowsComponent } from '../info-rows/info-rows.component';
import { ShipmentTimelineComponent } from '../shipment-timeline/shipment-timeline.component';

@Component({
  selector: 'vic-dispatch-detail',
  standalone: true,
  imports: [
    FailurePanelComponent,
    WaitingPanelComponent,
    ManualAssignDialogComponent,
    InfoRowsComponent,
    ShipmentTimelineComponent,
  ],
  templateUrl: './dispatch-detail.component.html',
  styleUrl: './dispatch-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchDetailComponent {
  readonly detail = input<DispatchDetail | null>(null);
  readonly shippers = input<DispatchShipper[]>([]);
  readonly actionLoading = input<boolean>(false);

  readonly resolveFailure = output<{ action: ResolutionAction; note?: string }>();
  readonly manualAssign = output<number>();

  readonly assignDialog = viewChild<ManualAssignDialogComponent>('assignDialog');

  readonly badgeInfo = computed(() => {
    const d = this.detail();
    return d ? getStatusBadge(d.displayStatus) : null;
  });

  onOpenAssignDialog(): void {
    this.assignDialog()?.open();
  }

  onResolve(event: { action: ResolutionAction; note?: string }): void {
    this.resolveFailure.emit(event);
  }

  onConfirmAssign(shipperId: number): void {
    this.manualAssign.emit(shipperId);
  }
}
