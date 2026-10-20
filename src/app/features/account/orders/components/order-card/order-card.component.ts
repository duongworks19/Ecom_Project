import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { CustomerOrder } from '../../data-access/orders.models';
import { getOrderStatusPresentation } from '../../utils/order-status.map';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';
import { StatusDotComponent } from '../../../../../shared/ui/status-dot/status-dot.component';
import { ButtonComponent } from '../../../../../shared/ui/button/button.component';

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [VndCurrencyPipe, StatusDotComponent, ButtonComponent],
  templateUrl: './order-card.component.html',
  styleUrl: './order-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderCardComponent {
  readonly order = input.required<CustomerOrder>();
  readonly rebuying = input<boolean>(false);

  readonly viewDetailClicked = output<CustomerOrder>();
  readonly cancelClicked = output<CustomerOrder>();
  readonly rebuyClicked = output<CustomerOrder>();

  readonly brokenImages = signal<Record<number, boolean>>({});

  readonly statusPresentation = computed(() =>
    getOrderStatusPresentation(this.order().status)
  );

  readonly showCancelButton = computed(() => {
    const o = this.order();
    return o.status === 'PENDING' && Boolean(o.canCancel);
  });

  readonly showRebuyButton = computed(() => {
    const status = this.order().status;
    return status === 'COMPLETED' || status === 'CANCELLED';
  });

  onImageError(productId: number): void {
    this.brokenImages.update((prev) => ({ ...prev, [productId]: true }));
  }
}
