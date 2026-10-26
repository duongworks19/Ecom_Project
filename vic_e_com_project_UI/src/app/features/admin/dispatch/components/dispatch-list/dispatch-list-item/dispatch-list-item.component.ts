import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DispatchItem } from '../../../models/dispatch.models';
import { getStatusBadge } from '../../../utils/dispatch-helpers';
import { VndCurrencyPipe } from '../../../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'vic-dispatch-list-item',
  standalone: true,
  imports: [VndCurrencyPipe],
  templateUrl: './dispatch-list-item.component.html',
  styleUrl: './dispatch-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchListItemComponent {
  readonly item = input.required<DispatchItem>();
  readonly isSelected = input<boolean>(false);
  readonly selected = output<DispatchItem>();

  readonly badgeInfo = computed(() => getStatusBadge(this.item().displayStatus));

  onClick(): void {
    this.selected.emit(this.item());
  }

  getDistrictText(): string {
    const raw = this.item().district;
    if (!raw) return 'Khu vực chưa rõ';
    const parts = raw.split(',');
    return parts[parts.length - 2]?.trim() || parts[0]?.trim() || raw;
  }
}
