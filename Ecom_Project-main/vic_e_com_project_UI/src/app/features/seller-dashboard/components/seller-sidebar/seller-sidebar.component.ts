import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  SellerNavTab,
  SellerTodo,
  VendorState,
} from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './seller-sidebar.component.html',
  styleUrl: './seller-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerSidebarComponent {
  readonly activeNav = input.required<SellerNavTab>();
  readonly shopState = input<VendorState>('APPROVED');
  readonly todos = input<SellerTodo>();
  readonly openOrdersCount = input<number>(0);
  readonly returnsCount = input<number>(0);
  readonly lowStockCount = input<number>(0);
  readonly reviewsCount = input<number>(0);
  readonly qaCount = input<number>(0);

  readonly navSelect = output<SellerNavTab>();
  readonly addProductClick = output<void>();

  readonly isOff = computed(() => this.shopState() !== 'APPROVED');

  onSelect(tab: SellerNavTab, event: Event): void {
    event.preventDefault();
    if (this.isOff() && tab !== 'overview') {
      return;
    }
    if (tab === 'add-product') {
      this.addProductClick.emit();
      return;
    }
    this.navSelect.emit(tab);
  }
}
