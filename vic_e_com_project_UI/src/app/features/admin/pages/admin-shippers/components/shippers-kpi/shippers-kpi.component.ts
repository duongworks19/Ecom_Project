import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShipperSummary } from '../../../../models/shipper.models';

@Component({
  selector: 'vic-shippers-kpi',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shippers-kpi.component.html',
  styleUrl: './shippers-kpi.component.scss',
})
export class ShippersKpiComponent {
  @Input({ required: true }) summary!: ShipperSummary;
}
