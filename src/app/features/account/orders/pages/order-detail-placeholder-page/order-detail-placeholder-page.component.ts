import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrdersApiService } from '../../data-access/orders-api.service';
import { CustomerOrder } from '../../data-access/orders.models';
import { getOrderStatusPresentation } from '../../utils/order-status.map';
import { ApiError } from '../../../../../core/api/api-error.model';
import { VndCurrencyPipe } from '../../../../../shared/pipes/vnd-currency.pipe';
import { formatDateVn } from '../../../../../shared/pipes/date-format.util';
import { StatusDotComponent } from '../../../../../shared/ui/status-dot/status-dot.component';
import { SkeletonComponent } from '../../../../../shared/ui/skeleton/skeleton.component';
import { ErrorStateComponent } from '../../../../../shared/ui/error-state/error-state.component';

@Component({
  selector: 'app-order-detail-placeholder-page',
  standalone: true,
  imports: [
    RouterLink,
    VndCurrencyPipe,
    StatusDotComponent,
    SkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './order-detail-placeholder-page.component.html',
  styleUrl: './order-detail-placeholder-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderDetailPlaceholderPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly ordersApi = inject(OrdersApiService);

  readonly order = signal<CustomerOrder | null>(null);
  readonly loading = signal<boolean>(false);
  readonly error = signal<ApiError | null>(null);

  readonly statusPresentation = computed(() => {
    const o = this.order();
    return o ? getOrderStatusPresentation(o.status) : null;
  });

  readonly formattedCreatedAt = computed(() => formatDateVn(this.order()?.createdAt));

  ngOnInit(): void {
    this.loadOrderDetail();
  }

  loadOrderDetail(): void {
    const idParam = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(idParam) || idParam <= 0) {
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.ordersApi.getOrderById(idParam).subscribe({
      next: (order) => {
        this.order.set(order);
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      },
    });
  }
}
