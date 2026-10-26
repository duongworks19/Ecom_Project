import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DispatchItem } from '../../models/dispatch.models';
import { DispatchListItemComponent } from './dispatch-list-item/dispatch-list-item.component';

@Component({
  selector: 'vic-dispatch-list',
  standalone: true,
  imports: [DispatchListItemComponent],
  templateUrl: './dispatch-list.component.html',
  styleUrl: './dispatch-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DispatchListComponent {
  readonly items = input<DispatchItem[]>([]);
  readonly selectedOrderId = input<number | null>(null);
  readonly loading = input<boolean>(false);
  readonly error = input<string | null>(null);

  readonly itemSelected = output<DispatchItem>();
  readonly retry = output<void>();

  onSelect(item: DispatchItem): void {
    this.itemSelected.emit(item);
  }

  onRetry(): void {
    this.retry.emit();
  }
}
