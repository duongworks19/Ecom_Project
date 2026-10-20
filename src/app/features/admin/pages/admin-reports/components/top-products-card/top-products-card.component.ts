import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopProductItem } from '../../../../models/admin-reports.model';

@Component({
  selector: 'vic-top-products-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-products-card.component.html',
  styleUrl: './top-products-card.component.scss',
})
export class TopProductsCardComponent {
  @Input() products: TopProductItem[] = [];
}
