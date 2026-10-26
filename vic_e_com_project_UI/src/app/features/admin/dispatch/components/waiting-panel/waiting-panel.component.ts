import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DispatchDetail, DispatchShipper } from '../../models/dispatch.models';

@Component({
  selector: 'vic-waiting-panel',
  standalone: true,
  templateUrl: './waiting-panel.component.html',
  styleUrl: './waiting-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WaitingPanelComponent {
  readonly detail = input.required<DispatchDetail>();
  readonly availableShippers = input<DispatchShipper[]>([]);
  readonly openManualAssign = output<void>();

  readonly filteredAvailableShippers = computed(() => {
    return this.availableShippers().filter((s) => s.workStatus === 'AVAILABLE');
  });

  onManualAssign(): void {
    this.openManualAssign.emit();
  }
}
