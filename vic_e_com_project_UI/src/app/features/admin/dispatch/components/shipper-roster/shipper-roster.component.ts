import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DispatchShipper } from '../../models/dispatch.models';

@Component({
  selector: 'vic-shipper-roster',
  standalone: true,
  templateUrl: './shipper-roster.component.html',
  styleUrl: './shipper-roster.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShipperRosterComponent {
  readonly shippers = input<DispatchShipper[]>([]);

  readonly availableShippers = computed(() => {
    return this.shippers().filter((s) => s.workStatus === 'AVAILABLE');
  });

  readonly readyCount = computed(() => {
    return this.availableShippers().filter(
      (s) => s.activeOrders < s.maxActiveOrders
    ).length;
  });

  readonly totalCount = computed(() => this.availableShippers().length);

  isBusy(shipper: DispatchShipper): boolean {
    return shipper.activeOrders >= shipper.maxActiveOrders;
  }

  statusLabel(shipper: DispatchShipper): string {
    return this.isBusy(shipper) ? 'BUSY' : (shipper.workStatus || 'AVAILABLE');
  }
}
