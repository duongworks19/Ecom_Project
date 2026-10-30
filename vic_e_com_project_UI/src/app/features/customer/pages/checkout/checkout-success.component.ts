import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VndCurrencyPipe } from '../../../../shared/pipes/vnd-currency.pipe';
import { PlaceOrderResponse } from './models/checkout.models';

@Component({
  selector: 'vic-checkout-success',
  standalone: true,
  imports: [CommonModule, RouterLink, VndCurrencyPipe],
  templateUrl: './checkout-success.component.html',
  styleUrl: './checkout-success.component.scss',
})
export class CheckoutSuccessComponent implements OnInit {
  readonly placed = signal<PlaceOrderResponse | null>(null);

  ngOnInit(): void {
    // ponytail: State comes from router navigation. If user refreshes, fallback message is displayed until checkoutGroupId lookup API is available.
    const stateData = history.state?.placed as PlaceOrderResponse | undefined;
    if (stateData && stateData.orders) {
      this.placed.set(stateData);
    }
  }
}

