import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-cart-table-head',
  standalone: true,
  templateUrl: './cart-table-head.component.html',
  styleUrl: './cart-table-head.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartTableHeadComponent {
  @Input() isAllChecked = false;
  @Input() totalCount = 0;
  @Output() toggleAll = new EventEmitter<boolean>();

  onToggle(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.toggleAll.emit(input.checked);
  }
}
