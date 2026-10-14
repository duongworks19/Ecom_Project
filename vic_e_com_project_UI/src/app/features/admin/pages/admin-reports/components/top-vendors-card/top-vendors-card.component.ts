import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopVendorItem } from '../../../../models/admin-reports.model';

@Component({
  selector: 'vic-top-vendors-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './top-vendors-card.component.html',
  styleUrl: './top-vendors-card.component.scss',
})
export class TopVendorsCardComponent {
  @Input() vendors: TopVendorItem[] = [];

  formatVal(val: number): string {
    return val.toString().replace('.', ',');
  }
}
