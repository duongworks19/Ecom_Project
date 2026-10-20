import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  SellerNavTab,
  SellerTodo,
} from '../../models/seller-dashboard.model';

@Component({
  selector: 'app-seller-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './seller-sidebar.component.html',
  styleUrl: './seller-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SellerSidebarComponent {
  readonly activeNav = input.required<SellerNavTab>();
  readonly todos = input.required<SellerTodo>();

  readonly navSelect = output<SellerNavTab>();
  readonly addProductClick = output<void>();

  readonly totalPendingOrders = computed(() => {
    const t = this.todos();
    return t.pendingConfirmationOrders + t.pendingPackagingOrders;
  });

  onSelect(tab: SellerNavTab, event: Event): void {
    event.preventDefault();
    if (tab === 'add-product') {
      this.addProductClick.emit();
      return;
    }
    this.navSelect.emit(tab);
  }
}
