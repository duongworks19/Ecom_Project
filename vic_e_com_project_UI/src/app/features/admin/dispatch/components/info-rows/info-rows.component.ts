import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DispatchDetail } from '../../models/dispatch.models';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';

@Component({
  selector: 'vic-info-rows',
  standalone: true,
  imports: [VndCurrencyPipe],
  templateUrl: './info-rows.component.html',
  styleUrl: './info-rows.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoRowsComponent {
  readonly detail = input.required<DispatchDetail>();

  isCodCollected(): boolean {
    return this.detail().displayStatus === 'DELIVERED';
  }
}
