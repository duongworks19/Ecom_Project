import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { formatRelativeSeconds } from '../../utils/dispatch-helpers';

@Component({
  selector: 'vic-dispatch-status-bar',
  standalone: true,
  templateUrl: './dispatch-status-bar.component.html',
  styleUrl: './dispatch-status-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchStatusBarComponent {
  readonly running = input<boolean>(true);
  readonly lastScanAt = input<string | null>(null);

  readonly scanText = computed(() => {
    const time = this.lastScanAt();
    return formatRelativeSeconds(time);
  });
}
