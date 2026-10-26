import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DispatchCounts } from '../../models/dispatch.models';

@Component({
  selector: 'vic-dispatch-kpi-cards',
  standalone: true,
  templateUrl: './dispatch-kpi-cards.component.html',
  styleUrl: './dispatch-kpi-cards.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchKpiCardsComponent {
  readonly counts = input<DispatchCounts>({
    waiting: 0,
    delivering: 0,
    failed: 0,
    delivered: 0,
  });

  readonly currentFilter = input<string>('ALL');
  readonly filterSelected = output<string>();

  onSelect(status: string): void {
    if (this.currentFilter() === status) {
      this.filterSelected.emit('ALL');
    } else {
      this.filterSelected.emit(status);
    }
  }
}
