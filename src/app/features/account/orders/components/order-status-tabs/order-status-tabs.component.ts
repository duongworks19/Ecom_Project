import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  QueryList,
  ViewChildren,
  input,
  output,
} from '@angular/core';
import { OrderStatusCounts, OrderStatusFilter } from '../../data-access/orders.models';
import { ORDER_STATUS_TABS, OrderTabDefinition } from '../../utils/order-status.map';

@Component({
  selector: 'app-order-status-tabs',
  standalone: true,
  templateUrl: './order-status-tabs.component.html',
  styleUrl: './order-status-tabs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderStatusTabsComponent {
  readonly activeStatus = input<OrderStatusFilter>('ALL');
  readonly counts = input<OrderStatusCounts | undefined>(undefined);

  readonly statusChanged = output<OrderStatusFilter>();

  readonly tabs: readonly OrderTabDefinition[] = ORDER_STATUS_TABS;

  @ViewChildren('tabButton') tabButtons?: QueryList<ElementRef<HTMLButtonElement>>;

  selectTab(key: OrderStatusFilter): void {
    if (this.activeStatus() !== key) {
      this.statusChanged.emit(key);
    }
  }

  getCount(key: OrderStatusFilter): number | null {
    const map = this.counts();
    if (!map) {
      return null;
    }
    const val = map[key];
    return typeof val === 'number' ? val : null;
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const total = this.tabs.length;
    let targetIndex: number | null = null;

    if (event.key === 'ArrowRight') {
      targetIndex = (index + 1) % total;
    } else if (event.key === 'ArrowLeft') {
      targetIndex = (index - 1 + total) % total;
    } else if (event.key === 'Home') {
      targetIndex = 0;
    } else if (event.key === 'End') {
      targetIndex = total - 1;
    }

    if (targetIndex !== null) {
      event.preventDefault();
      const targetTab = this.tabs[targetIndex];
      this.selectTab(targetTab.key);
      const buttons = this.tabButtons?.toArray() ?? [];
      buttons[targetIndex]?.nativeElement.focus();
    }
  }
}
